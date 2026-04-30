import { Ipost } from "../../common/interface/post.interface.js";
import { PostModel } from "../model/post.model.js";
import { DataBaseRepository } from "./base.repository.js";

export class PostRepository extends DataBaseRepository<Ipost> {
    constructor() {
        super(PostModel)
    }
}
