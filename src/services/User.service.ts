import {post} from 'superagent';
import {inject} from '@loopback/core';

/**
 * Service for user related functionality
 */
export class UserService {

    @inject('api.user')
    private userApi: string;

    /**
     * Allows users to sign up to the platform
     *
     * @param username - The username
     * @param email - The email
     * @param password - The password
     */
    async signup(username: string, email: string, password: string) {
        const response = await post(`${this.userApi}/users`).send({username, email, password});

        return response.body;
    }

    /**
     * Allows users to login to the platform
     *
     * @param username - The username
     * @param password - The password
     */
    async login(username: string, password: string) {
        const response = await post(`${this.userApi}/login`).auth(username, password, {type: 'basic'}).send();

        return response.body;
    }
}