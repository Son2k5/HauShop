import apiClient from "../api/apiClient";
import type  { Category, CategorySummary } from "../@types/product.type";

const BASE_URL = '/category';

const get = async<T>(url: string, params? : object , signal?: AbortSignal) : Promise<T> =>{
    const result = await apiClient.get<T>(url, {
        ...(params ? {params} : {}),
        ...(signal  ? {signal} : {})
    });
    return result.data;
}

export const categoryService = {
    getAll: async(signal? : AbortSignal): Promise<CategorySummary[]>  => {
        return get<Category[]> (BASE_URL, undefined, signal);
    },
    getActive: async (signal?: AbortSignal): Promise<CategorySummary[]> => {         
         return get<CategorySummary[]>(`${BASE_URL}/active`, undefined, signal);        
    },   
}