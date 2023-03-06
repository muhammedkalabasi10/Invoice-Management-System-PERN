import postgreConnection from "../util/db.js";

class Product{
    constructor(_id, name, price, selectedFiles){
        this._id=_id
        this.name=name
        this.price=price
        this.selectedFiles=selectedFiles
    }

    save(){
        return postgreConnection.query("INSERT INTO \"Products\"(name, price, \"selectedFiles\") VALUES ($1,$2,$3) RETURNING *",[this.name, this.price, this.selectedFiles])
    }

    update(){
        return postgreConnection.query("UPDATE \"Products\" SET name=$1, price=$2, \"selectedFiles\"=$3 WHERE _id=$4 RETURNING *",[this.name,this.price,this.selectedFiles,this._id])
    }

    static fetch(){
        return postgreConnection.query("SELECT * FROM \"Products\"");
    }

    static find(_id){
        return postgreConnection.query("SELECT * FROM \"Products\" WHERE _id=$1",[_id]);
    }

    static delete(_id){
        return postgreConnection.query("DELETE FROM \"Products\" WHERE _id=$1",[_id])
    }

}

export default Product