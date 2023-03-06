import postgreConnection from "../util/db.js";
import format from "pg-format"
class Product{
    constructor(_id, dueDate, client, total, status, creatorId, createDate){
        this._id=_id;
        this.dueDate=dueDate;
        this.client=client;
        this.total=total;
        this.status=status;
        this.creatorId=creatorId;
        this.createDate=createDate;
    }
    saveInvoice(){
        return postgreConnection.query("INSERT INTO \"Invoice\"(\"dueDate\", \"clientId\", total, status, \"creatorId\", \"createDate\") VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",[this.dueDate, this.client._id, this.total, this.status, this.creatorId,this.createDate])
    }

    static fetch(){
        return postgreConnection.query("SELECT \"Invoice\"._id, \"dueDate\", \"clientId\",total, status, \"creatorId\",\"createDate\", name, email, phone, address FROM \"Invoice\" INNER JOIN \"Clients\" ON \"Invoice\".\"clientId\"=\"Clients\"._id")
    }

    async saveItems(items){
        await postgreConnection.connect()
        const query=format("INSERT INTO \"Items\"(\"itemName\", \"selectedFiles\", \"unitPrice\", quantity, unit,discount,taxname,taxvalue, \"invoiceId\") VALUES %L RETURNING *",items)
        return postgreConnection.query(query)
    }

    static getInvoice(_id){
        return postgreConnection.query("SELECT * FROM \"Invoice\" INNER JOIN \"Clients\" ON \"Invoice\".\"clientId\"=\"Clients\"._id WHERE \"Invoice\"._id=$1",[_id])
    }

    static async getItems(invoiceId){
        let items=[]
        const response=await postgreConnection.query("SELECT _id, \"itemName\", \"selectedFiles\", \"unitPrice\", quantity, unit, taxname, taxvalue, discount FROM \"Items\" WHERE \"invoiceId\"=$1",[invoiceId])
        await Promise.all(response.rows?.map(async(item)=>{
            items.push({
                _id:item._id,
                itemName:item.itemName,
                selectedFiles:item.selectedFiles,
                unitPrice:item.unitPrice,
                quantity:item.quantity,
                unit:item.unit,
                tax:{
                    taxname:item.taxname,
                    taxvalue:item.taxvalue
                },
                discount:item.discount
            })
        })).catch((err)=>{
            console.log(err)
        })
        return items
    }

    static async addPayment(payment, datePaid, invoiceID){
            return postgreConnection.query("INSERT INTO \"paymentRecords\"(payment,\"datePaid\",\"invoiceID\") VALUES ($1,$2,$3) RETURNING *",[payment, datePaid, invoiceID])
    }

    static doPaid(invoiceID){
        return postgreConnection.query("UPDATE \"Invoice\" SET status=$1 WHERE _id=$2",["Paid",invoiceID])
    }

    static getPayments(invoiceID){
        return postgreConnection.query("SELECT _id, payment, \"datePaid\" FROM \"paymentRecords\" WHERE \"invoiceID\"=$1", [invoiceID])
    }

    static delete(_id){
        return postgreConnection.query("DELETE FROM \"Invoice\" WHERE _id=$1",[_id])
    }
}

export default Product