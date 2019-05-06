import {sign} from 'jsonwebtoken';
import {inject} from '@loopback/context';

export class TokenService {

    @inject('jwt.secret')
    private jwtSecret: string;

    generateCiToken(userId: string, taskId: string) {
        return {
            token: sign({userId: userId, taskId: taskId}, this.jwtSecret, {expiresIn: 31536000})
        }
    }
}