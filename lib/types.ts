export type Product={id:string;name:string;quantity:number;minimum_quantity:number;created_at:string;updated_at:string};
export type ShoppingItem={id:string;product_id:string|null;name:string;quantity:number;completed:boolean;created_at:string;updated_at:string};
export type AppData={products:Product[];shopping:ShoppingItem[]};
