export interface RegisterDto {
    email: string;
    password: string;
    firstname: string;
    lastname?: string;
    phoneNumber: string
}
export interface LoginDto {
    email: string;
    password: string
}
export interface forgotPasswordDto {
    email: string
}
export interface resetPasswordDto 
{
    email: string;
    password: string;
    otp : string
}
export interface changePasswordDto {
    currentPassword: string;
    newPassword: string
}
export interface authUser{
    email: string;
    password: string;
    firstname: string;
    lastname?: string;
    phoneNumber: string;
    role: string;
}
export interface authResponse{
    accessToken : string;
    refreshToken : string;
    user: authUser;
}