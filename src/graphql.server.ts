import { Server, CoreBindings, Application } from '@loopback/core';
import { Context, inject } from '@loopback/context';
import { ApolloServer, makeExecutableSchema } from 'apollo-server-express';
import * as express from 'express';
import { verify } from 'jsonwebtoken';
import * as jwt from 'express-jwt';
import { Logger } from 'winston';
import * as http from 'http';
import { GraphqlService } from './services/Graphql.service';
import { typeDefs } from './types/types';

export class GraphqlServer extends Context implements Server {
    private _listening: boolean = false;
    private server: http.Server;

    @inject('logger')
    public logger: Logger;

    @inject('jwt.secret')
    public jwtSecret: string;

    @inject('server.port')
    public port: number;

    @inject('services.graphql')
    public graphqlService: GraphqlService;

    constructor(@inject(CoreBindings.APPLICATION_INSTANCE) public app?: Application) {
        super(app);
    }

    get listening() {
        return this._listening;
    }

    async start(): Promise<void> {
        const expressServer = express();

        const authMiddleware = jwt({secret: this.jwtSecret, credentialsRequired: false});

        expressServer.use(authMiddleware);

        expressServer.get('/', (req, res) => res.send({uptime: process.uptime()}));

        const server = new ApolloServer({
            schema: makeExecutableSchema({typeDefs, resolvers: this.graphqlService.getResolvers()}),
            playground: {},
            context: ({req}) => {
                let user: any = null;

                if (req.headers && req.headers.authorization) {
                    user = verify(req.headers.authorization.replace('Bearer ', ''), this.jwtSecret);
                }

                return {
                    user,
                    authenticated: user && user.userId,
                    taskId: (user || {}).taskId
                }
            }
        });

        server.applyMiddleware({app: expressServer});

        await new Promise((resolve) => {
            this.server = expressServer.listen(this.port, () => resolve());
        });
    }

    async stop(): Promise<void> {
        await this.server.close();
    }
}
