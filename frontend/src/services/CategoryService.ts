import type { CategoryDto, CategorySummaryDto } from "../@types/product.type";
import { http } from "../lib/http";

const BASE_URL = '/category';

const get = async<T>(url: string, params? : object , signal?: AbortSignal) : Promise<T> =>{
    return http.get<T>(url, {
        ...(params ? {params} : {}),
        ...(signal  ? {signal} : {})
    });
}

export const categoryService = {
    getAll: async(signal? : AbortSignal): Promise<CategoryDto[]>  => {
        return get<CategoryDto[]> (BASE_URL, undefined, signal);
    },
    getActive: async (signal?: AbortSignal): Promise<CategorySummaryDto[]> => {         
         return get<CategorySummaryDto[]>(`${BASE_URL}/active`, undefined, signal);        
    },   
}
