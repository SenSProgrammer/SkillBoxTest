class myCurrentDateTime {
  date='';
  time='';
 constructor() {
   let tmpDateTime = new Date();
    this.date = tmpDateTime.getDate()+"-"+tmpDateTime.getMonth()+"-"+tmpDateTime.getFullYear();
    this.time = tmpDateTime.getHours()+":"+tmpDateTime.getMinutes()+":"+tmpDateTime.getSeconds();


}
}


function currentDateTime(){
  return new myCurrentDateTime();

}

module.exports =
{
  currentDateTime,
};
