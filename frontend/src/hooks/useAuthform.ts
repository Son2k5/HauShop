import React, { useCallback, useState } from "react";
type Rules<T> = {
    [K in keyof T] ?: (val:string, all: T) => string | undefined;
}
interface Options<T>{
    initial: T;
    rules?: Rules<T>;
    onSubmit:(values : T) => Promise<void>
}
export function useAuthForm< T extends Record<string, string>>({
    initial, rules, onSubmit,
} : Options<T>) {
    const [values, setValues] = useState<T>(initial);
    const[fieldErrors, setFieldErrors] = useState<Partial <Record<keyof T, string>>>({});
    const[serverError, setServerError] = useState<string| null>(null);
    const[loading, setLoading] = useState(false);
    const[success, setSuccess] = useState(false);

    //input field for auth
    const field = useCallback(
        (key: keyof T) => (e : React.ChangeEvent<HTMLInputElement>) =>{
            setValues( p => ({...p, [key] : e.target.value}));
            setFieldErrors(p => ({...p, [key] : undefined}));
            setServerError(null);
        },[]
    )

    // check validate for auth
    const validate = useCallback(() : boolean =>{
        if(!rules) return true;
        const errs: Partial<Record<keyof T, string>> ={};
        let ok= true;
        for(const k in rules){
            const msg = rules[k]?.(values[k], values);
            if(msg) {
                errs[k] = msg; 
                ok = false;
            }
        }
        setFieldErrors(errs);
        return ok;
    },[rules, values]);

    //submit form
    const submit = useCallback ( async (e : React.FormEvent) =>{
        e.preventDefault();
        setServerError(null);
        if(!validate()) return;
        setLoading(true);
        try{
            await onSubmit(values);
            setSuccess(true);

        }catch(err){
            setServerError((err as {message ?: string}).message?? "Something went wrong");
        }finally{
            setLoading(false);
        }

    },[onSubmit, validate, values])
        const reset = useCallback(() => {
        setValues(initial);
        setFieldErrors({});
        setServerError(null);
        setSuccess(false);
    }, [initial]);
  return { values, fieldErrors, serverError, loading, success, field, submit, reset, setServerError };
}