import postgreConnection from "../util/db.js";

class Token {
  constructor(userId, token) {
    this.userId = userId;
    this.token = token;
  }

  save() {
    return postgreConnection.query(
      'INSERT INTO "Tokens"("userId", token) VALUES($1,$2) RETURNING *',
      [this.userId, this.token]
    );
  }

  static remove(userId,token) {
    return postgreConnection.query('DELETE FROM "Tokens" WHERE "userId"=$1 AND token=$2', [
      userId,token
    ]);
  }

  static findOne(userId,token) {
    return postgreConnection.query("SELECT * FROM \"Tokens\" WHERE \"userId\"=$1 AND token=$2",[userId,token])
  }
}

export default Token;
