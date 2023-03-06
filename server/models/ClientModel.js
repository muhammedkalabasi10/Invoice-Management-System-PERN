import postgreConnection from "../util/db.js";

class Client{
    constructor(_id, name, email, phone,address){
        this._id=_id
        this.name=name
        this.email=email
        this.phone=phone
        this.address=address
    }
    save(){
        return postgreConnection.query("INSERT INTO \"Clients\"(name, email, phone,address) VALUES ($1,$2,$3,$4) RETURNING *",[this.name, this.email, this.phone, this.address])
    }

    update(){
        return postgreConnection.query("UPDATE \"Clients\" SET name=$1, email=$2, phone=$3, address=$4 WHERE _id=$5 RETURNING *",[this.name, this.email, this.phone, this.address,this._id])
    }

    static fetch(){
        return postgreConnection.query("SELECT * FROM \"Clients\"");
    }

    static find(_id){
        return postgreConnection.query("SELECT * FROM \"Clients\" WHERE _id=$1",[_id]);
    }

    static delete(_id){
        return postgreConnection.query("DELETE FROM \"Clients\" WHERE _id=$1",[_id])
    }
}

export default Client