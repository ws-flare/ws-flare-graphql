import {IResolvers} from "graphql-tools";
import {inject} from "@loopback/core";
import {UserService} from './User.service';
import {User} from '../models/User.model';

export class GraphqlService {

    @inject('services.user')
    private userService: UserService;

    getResolvers(): IResolvers {
        return {
            Query: {},

            Mutation: {
                // Users
                signup: (_: null, user: User) => this.userService.signup(user.username, user.email, user.password),

                login: (_: null, user: User) => this.userService.login(user.username, user.password),
            },
        }
    }
}