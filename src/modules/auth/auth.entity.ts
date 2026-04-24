export interface ILoginResponse {
    user: {
        _id: string;
        email: string;
        userName: string;
        firstName: string;
        lastName: string;
    };
}

export interface ISignupResponse {
    user: {
        _id: string;
        email: string;
        userName: string;
        firstName: string;
        lastName: string;
    };
}