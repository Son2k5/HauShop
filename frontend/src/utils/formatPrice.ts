export const formatPrice = (value : number) : string =>{
    return new Intl.NumberFormat('vi-VN',{
        style:'currency',
        currency:'VND',
        minimumFractionDigits:0,

    }).format(value);
}