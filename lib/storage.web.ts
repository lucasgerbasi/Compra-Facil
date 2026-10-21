import type {AppData,Product,ShoppingItem} from './types';
const KEY='compra-facil-v1'; const empty:AppData={products:[],shopping:[]};
const read=():AppData=>{try{return JSON.parse(localStorage.getItem(KEY)||JSON.stringify(empty))}catch{return empty}};
const write=(d:AppData)=>localStorage.setItem(KEY,JSON.stringify(d));
export async function initDb(){return read()}; export async function getData(){return read()};
export async function saveProduct(p:Product){const d=read(),i=d.products.findIndex(x=>x.id===p.id);i<0?d.products.push(p):d.products.splice(i,1,p);write(d)}
export async function deleteProduct(id:string){const d=read();d.products=d.products.filter(x=>x.id!==id);d.shopping=d.shopping.filter(x=>x.product_id!==id);write(d)}
export async function saveShopping(s:ShoppingItem){const d=read(),i=d.shopping.findIndex(x=>x.id===s.id);i<0?d.shopping.push(s):d.shopping.splice(i,1,s);write(d)}
export async function deleteShopping(id:string){const d=read();d.shopping=d.shopping.filter(x=>x.id!==id);write(d)}
