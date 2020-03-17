function getDateStr(diff) {

    var date = new Date();

    date.setDate(date.getDate() + diff);

    var dd = date.getDate();
    var mm = date.getMonth() + 1;

    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }

    //console.log(mm + '/' + dd);

    return mm + '/' + dd;

}
