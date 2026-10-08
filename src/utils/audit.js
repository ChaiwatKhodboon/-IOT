const pool=require('../db');
async function setActor(client,actorId){
  await client.query("SELECT set_config('app.actor_id',$1,true)",[String(actorId)]);
}
async function auditedQuery(actorId,sql,values){
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    await setActor(client,actorId);
    const result=await client.query(sql,values);
    await client.query('COMMIT');
    return result;
  }catch(error){await client.query('ROLLBACK');throw error}
  finally{client.release()}
}
module.exports={setActor,auditedQuery};
