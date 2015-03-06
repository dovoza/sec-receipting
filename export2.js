cursor = db.receipts.find().sort({recNum:1});



function to2Digits(num){
	var monthLength = num.toString().length;
	var month = (1+num).toString();
	if (monthLength == 1) {
		month = "0"+month;
		return month;
	}else {
		return month;
	}
}

function genLeft(field, alocSpace){
    var myfield = field.toString();
    if (myfield.length < alocSpace) {
        while (myfield.length < alocSpace) {
            myfield = "\xa0"+myfield;
        }
    } else {
	myfield = myfield.substring(0, alocSpace);
    }

    return myfield;

}

function posDec(amt) {
  var newValue = amt.toString();
  var n = newValue.indexOf(".");
  substr1 = newValue.substring(0,n);
  substr2 = newValue.substring(n,newValue.length);
  newSubStr1 = genLeft(substr1,9);
  return newSubStr1+substr2;
}

function genSpace(field, alocSpace){
    var myfield = field.toString();
    if (myfield.length < alocSpace) {
        while (myfield.length < alocSpace) {
            myfield = myfield +"\xa0";
        } 
    } else {
        myfield = myfield.substring(0, alocSpace);
    }

    return myfield;
       
}

function genZero(field, alocSpace){
    var myfield = field.toString();
    if (myfield.length < alocSpace) {
        while (myfield.length < alocSpace) {
            myfield = "0"+myfield;
        }
    } else {
	myfield = myfield.substring(0, alocSpace);
    }

    return myfield;

}

function toDec(value){
    var newValue = value.toString();
    var n = newValue.indexOf(".");   
    var substr1 = newValue.substring(0,n-1);
    var substr2 = newValue.substring(n+1,newValue.length);	


    if (n < 0){
        var newValue = newValue+".00";
    } else if (n==1) {
       var newValue = "0."+substr2;
   

    } else {
        if (substr2.length == 1){
          var newValue = substr1+"."+substr2+"0";
        }
    }
    return newValue;
}

var sumAmntDue = 0;
var recordCount = 0;

while (cursor.hasNext()) {
    receipt = cursor.next();

    sumAmntDue += Number(receipt.amtdue);
    recordCount += 1;

    var d = new Date(receipt.recDate);
    var datestr = d.getFullYear().toString()+to2Digits(d.getMonth())+to2Digits(d.getDay());
    var quad8 = "8888";
    var se = "SE";
    var eleven = 11;
    var numString = "9999920305";
    var accountSpace = "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0";
    var otherPaymentsGl = "HF889999A9";;
    var zero = 0;

    if (receipt.recType == "spu"){
    	receipt.itemcode = 2;
    } else if (receipt.recType == "capital"){
    	receipt.itemcode = 7;
    }else if (receipt.recType == "deposits") {
    	receipt.itemcode = 5;
    }else if (receipt.recType == "visits") {
    	receipt.itemcode = 9;
    } else if (receipt.recType == "otherPayments") {
    	receipt.itemcode = 3;
    }

    if (receipt.payMeth == "Cheque"){ 

        var bankChar = receipt.cheQue.bankCode.substring(0,1);  

        if (receipt.recType == "spu") {
        	print(receipt.mPayPos +receipt.itemcode + genZero(receipt.transNo,4) + receipt.recBatch + datestr +quad8 + "\xa0" + receipt.stnNum +se + receipt.recNum +  datestr +  eleven + receipt.account + "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" + zero+ "\xa0"+ genSpace(posDec(toDec(receipt.amtdue)),18) +"\xa0" + genSpace(bankChar,8) +"\xa0"+ numString+genSpace(receipt.custName,40)+"\xa0"+genSpace(receipt.custAddr,30)+"\xa0"+receipt.custCity);
    	} else if (receipt.recType == "capital") {
    		print(receipt.mPayPos + receipt.itemcode + genZero(receipt.transNo,4) +receipt.recBatch + datestr + quad8 + "\xa0" + receipt.stnNum + se +receipt.recNum + datestr  + eleven + "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" + genSpace(receipt.quoteRef,10) + zero+ "\xa0"+ genSpace(posDec(toDec(receipt.amtdue)),18) +"\xa0" + genSpace(bankChar,8) +"\xa0"+ numString+ genSpace(receipt.custName,40)+"\xa0"+genSpace(receipt.custAddr,30)+"\xa0"+receipt.custCity);
    	} else if (receipt.recType == "visits") {
    		print(receipt.mPayPos +receipt.itemcode +genZero(receipt.transNo,4) + receipt.recBatch + datestr  + quad8 + "\xa0" + receipt.stnNum  + se + receipt.recNum + datestr + eleven + "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" + genSpace(receipt.glCode,10)+ zero+ "\xa0"+ genSpace(posDec(toDec(receipt.amtdue)),18) +"\xa0" + genSpace(bankChar,8)+"\xa0"+ numString+ genSpace(receipt.custName,40)+"\xa0"+genSpace(receipt.custAddr,30)+"\xa0"+receipt.custCity);
    	} else if (receipt.recType == "deposits") {
    		print(receipt.mPayPos +receipt.itemcode + genZero(receipt.transNo,4)+ receipt.recBatch + datestr + quad8 + "\xa0" + receipt.stnNum  + se  + receipt.recNum  + datestr +  eleven +"\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" + genSpace(receipt.glCode,10)+  zero+ "\xa0"+ genSpace(posDec(toDec(receipt.amtdue)),18) +"\xa0" + genSpace(bankChar,8)+"\xa0"+ numString+ numString+"\xa0"+ genSpace(receipt.custName,40) +"\xa0"+genSpace(receipt.custAddr,30)+"\xa0"+receipt.custCity);
    	}else if (receipt.recType == "otherPayments") {
            if (receipt.custAddr == null) {
               print(receipt.mPayPos +receipt.itemcode +genZero(receipt.transNo,4)+ receipt.recBatch + datestr  + quad8 + "\xa0" + receipt.stnNum  + se + receipt.recNum  + datestr +  eleven +"\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"+ genSpace(otherPaymentsGl,10) + zero+ "\xa0"+genSpace(toDec(receipt.amtdue),18) +"\xa0" + genSpace(bankChar,8)+"\xa0"+ numString+ genSpace(receipt.custName,40)+"\xa0"+genSpace(receipt.custName,30)+"\xa0"+receipt.custName); 
           } else {
              print(receipt.mPayPos +receipt.itemcode +genZero(receipt.transNo,4)+ receipt.recBatch + datestr  + quad8 + "\xa0" + receipt.stnNum  + se + receipt.recNum  + datestr +  eleven +"\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"+ genSpace(otherPaymentsGl,10) + zero+ "\xa0"+genSpace(toDec(receipt.amtdue),18) +"\xa0" + genSpace(bankChar,8)+"\xa0"+ numString+ genSpace(receipt.custName,40)+"\xa0"+genSpace(receipt.custAddr,30)+"\xa0"+receipt.custCity);
           }        
        }
    } else {
        if (receipt.recType == "spu") {
            print(receipt.mPayPos + receipt.itemcode + genZero(receipt.transNo,4) + receipt.recBatch +  datestr + quad8 + "\xa0" + receipt.stnNum  + se + receipt.recNum  + datestr  + eleven +receipt.account + "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" + zero +"\xa0"+ genSpace(posDec(toDec(receipt.amtdue)),27) +"\xa0"+ numString+genSpace(receipt.custName,40)+"\xa0"+genSpace(receipt.custAddr,30)+"\xa0"+receipt.custCity);
        } else if (receipt.recType == "capital") {
            print(receipt.mPayPos + receipt.itemcode +  genZero(receipt.transNo,4) +  receipt.recBatch +  datestr  + quad8 + "\xa0"+ receipt.stnNum  + se  + receipt.recNum + datestr + eleven +"\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" + genSpace(receipt.quoteRef,10) + zero+"\xa0"+ genSpace(posDec(toDec(receipt.amtdue)),27) +"\xa0"+ numString+ genSpace(receipt.custName,40)+"\xa0"+genSpace(receipt.custName,30)+"\xa0"+receipt.custName);
        } else if (receipt.recType == "visits") {
            print(receipt.mPayPos + receipt.itemcode  + genZero(receipt.transNo,4) +  receipt.recBatch +  datestr  + quad8 + "\xa0" + receipt.stnNum  + se  + receipt.recNum  + datestr + eleven +"\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" + genSpace(receipt.glCode,10)+ zero+"\xa0"+ genSpace(posDec(toDec(receipt.amtdue)),27) +"\xa0"+ numString+ genSpace(receipt.custName,40)+"\xa0"+genSpace(receipt.custAddr,30)+"\xa0"+receipt.custCity);
        } else if (receipt.recType == "deposits") {
            print(receipt.mPayPos + receipt.itemcode  + genZero(receipt.transNo,4) + receipt.recBatch +  datestr  + quad8 + "\xa0" + receipt.stnNum  + se  + receipt.recNum  + datestr  + eleven +"\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" + genSpace(receipt.glCode,10)+ zero+"\xa0"+"\xa0"+ genSpace(posDec(toDec(receipt.amtdue)),27) +"\xa0"+ numString+ numString+"\xa0"+ genSpace(receipt.custName,40) +"\xa0"+genSpace(receipt.custAddr,30)+"\xa0"+receipt.custCity);
        }else if (receipt.recType == "otherPayments") {
            if (receipt.custAddr == null) {
               print(receipt.mPayPos +receipt.itemcode +genZero(receipt.transNo,4)+ receipt.recBatch + datestr  + quad8 + "\xa0" + receipt.stnNum  + se + receipt.recNum  + datestr +  eleven +"\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"+ genSpace(otherPaymentsGl,10) + zero+ "\xa0"+genSpace(toDec(receipt.amtdue),18) +"\xa0" + genSpace(bankChar,8)+"\xa0"+ numString+ genSpace(receipt.custName,40)+"\xa0"+genSpace(receipt.custName,30)+"\xa0"+receipt.custName); 
            } else {
                print(receipt.mPayPos +receipt.itemcode  + genZero(receipt.transNo,4) +  receipt.recBatch + datestr + quad8 + "\xa0" + receipt.stnNum  + se  + receipt.recNum + datestr + eleven +"\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" + genSpace(otherPaymentsGl,10) + zero+ "\xa0"+genSpace(toDec(receipt.amtdue),27) +"\xa0"+ numString+ genSpace(receipt.custName,40)+"\xa0"+genSpace(receipt.custAddr,30)+"\xa0"+receipt.custCity);
            }
        }

    }

}
print("*END*\xa0DT210302\xa021\xa0IPS11A01\xa0\xa0\xa0"+recordCount+"\xa0\xa0\xa0\xa0\xa0"+sumAmntDue); 
