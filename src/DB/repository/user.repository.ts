import { IUser } from "../../common/interface/user.interface.js";
import UserModel from "../model/user.model.js";
import { DataBaseRepository } from "./base.repository.js";

export class UserRepository extends DataBaseRepository<IUser> {
    constructor() {
        super(UserModel)
    }
}
