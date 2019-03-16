import {post} from 'superagent';
import {inject} from '@loopback/core';

export class UserService {

    @inject('api.user')
    private userApi: string;

    async signup(username: string, email: string, password: string) {
        const response = await post(`${this.userApi}/users`).send({username, email, password});

        return response.body;
    }

    async login(username: string, password: string) {
        const response = await post(`${this.userApi}/login`).auth(username, password, {type: 'basic'}).send();

        return response.body;
    }
}