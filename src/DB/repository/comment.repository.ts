import { IComment } from "../../common/interface/comment.interface.js";
import { CommentModel } from "../model/comment.model.js";
import { DataBaseRepository } from "./base.repository.js";

export class CommentRepository extends DataBaseRepository<IComment> {
    constructor() {
        super(CommentModel)
    }
}
