/*import mongoose from 'mongoose'

const userSchema=mongoose.Schema({
    name:{type: String, required:true},
    surName:{type:String, required:true},
    email:{type:String,required:true},
    phone:{type:String, required:true},
    password:{type:String,required:true},
    verified:{type: Boolean, default:false}
})

const UserModel=mongoose.model('user',userSchema)
export default UserModel*/

import postgreConnection from "../util/db.js";

class User{
    constructor(_id, name, surname, email, phone, password){
        this._id=_id
        this.name=name
        this.surname=surname
        this.email=email
        this.phone=phone
        this.password=password
    }

    save(){
        return postgreConnection.query("INSERT INTO \"Users\"(name, surname, email, phone, password) VALUES ($1,$2,$3,$4,$5) RETURNING *",[this.name, this.surname, this.email, this.phone, this.password])
    }

    update(){
        if(this.password){
            return postgreConnection.query("UPDATE \"Users\" SET password=$1 WHERE _id=$2 RETURNING *",[this.password,this._id])
        }else{
            return postgreConnection.query("UPDATE \"Users\" SET name=$1, surname=$2, email=$3, phone=$4 WHERE _id=$5 RETURNING *",[this.name,this.surname,this.email,this.phone,this._id])
        }
    }

    static async findOne({_id:_id, email:email, phone:phone}){
        if(_id){
            const response=await postgreConnection.query("SELECT * FROM \"Users\" WHERE _id=$1",[_id])
            return response.rows[0]
        }else if(email){
            const response=await postgreConnection.query("SELECT * FROM \"Users\" WHERE email=$1",[email])
            return response.rows[0]
        }else{
            const response=await postgreConnection.query("SELECT * FROM \"Users\" WHERE phone=$1",[phone])
            return response.rows[0]
        }
    }

    static activateUser(userId){
        return postgreConnection.query("UPDATE \"Users\" SET verified=$1 WHERE _id=$2 RETURNING *",[true,userId])
    }

}

export default User