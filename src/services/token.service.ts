import {sign} from 'jsonwebtoken';
import {inject} from '@loopback/context';

/**
 * Service for token related functionality
 */
export class TokenService {

    @inject('jwt.secret')
    private jwtSecret: string;

    /**
     * Generates a new JWT token for the ws-flare-cli tool to get passed security
     *
     * @param userId - The user id which requested the token
     * @param taskId - The task id
     */
    generateCiToken(userId: string, taskId: string) {
        return {
            token: sign({userId: userId, taskId: taskId}, this.jwtSecret, {expiresIn: 31536000})
        }
    }
}