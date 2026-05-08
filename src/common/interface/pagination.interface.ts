import { HydratedDocument } from "mongoose";


export interface Ipagination<TRowDocumnet> {
    docs: HydratedDocument<TRowDocumnet>[] | TRowDocumnet[];
    pages?: number | string | undefined;
    currentPage?: number | string | undefined;
    size?: number | string | undefined;
}