var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);
var fs = require('fs');

//define routes
var routes = require('./routes/index');

//instantiate application
var app = express();

//connect to db
var databaseUrl = "receipting";
var collections = ["users", "banks", "stations", "customers", "batches", "receipts", "quotes", "receiptIncrVals", "stationParams", "glcodes", "receiptlog"];
var db = require("mongojs").connect(databaseUrl, collections)

//MySql  --> Aging Analysis
var mysql = require('mysql');
var mysqlconn = mysql.createConnection({
    host: '147.110.192.250',
    user: 'root',
    password: 'secret09',
    database: 'sebinfo',
    insecureAuth: true,
    port: 3306
});
 
//MSSQL --> CRM Quotations
var mssql = require('mssql');
var mssqlconf = {
    user: 'sa',
    password: 'P@ssw0rd',
    server: '147.110.192.53'
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({
    secret: 'secret',
    store: new MongoStore({
    db: 'receipting',
    host: '127.0.0.1',
    port: 27017,
    resave: false,
    saveUninitialized: false
  })
 }));
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/', routes);

var sess;

/***********************************************
      INTEGRATION ROUTES
***********************************************/

app.post('/refreshCust', function(req, res){
    mysqlconn.connect();
    var query = mysqlconn.query('select * from Aging', function(err, result, fields){
        if(err){
            throw err;
        }


        db.customers.remove(function(err, data) {
            if(!data){
                res.send("Error Could Not Refresh Data, Please check Connection to 147.110.192.250!");
            }
            else {
                result.forEach(function(cust){
                    db.customers.insert(cust);
                });
                res.send('customers refereshed successfully!');
            }
        });

        mysqlconn.end();
    })

});

app.post('/refreshQuotes',function(req, res){
    mssql.connect(mssqlconf, function(err){
        if(err){throw err;}
        var request = new mssql.Request();
        request.query('select a.*, b.oppo_groupcustname from CRM.dbo.Quotes a join CRM.dbo.Opportunity b on a.Quot_opportunityid = b.Oppo_OpportunityId', function(err, recordset){
            if(err){throw err};
            db.quotes.remove(function(err, data) {
            if(!data){
                res.send("Error Could Not Refresh Data, Please check Connection to 147.110.192.250!");
            }
            else {
                recordset.forEach(function(quote){
                    db.quotes.insert(quote);
                });
                res.send('quotationss refereshed successfully!');
            }
        });
        });
    });
});

//**********************************************
//    RETRIEVE INDIVIDUAL DOCUMENTS ROUTES
//***********************************************
// user to be authenticated
app.post('/userAuthenticate', function(req, res) {
    sess = req.session;
    var user = {
        uname: req.body.uname, 
        passkey: req.body.passkey
    }

    db.users.findOne(user, function (err, data){
        if (data){
            req.session.uname = data.uname;
            res.send(data);
        }else {
            res.send("User doesnot exist");
        }
    });
});

//get a specific user
app.post('/getUser/:uname', function(req, res) {
    var username = req.params.uname;
    //sess.uname = username;
    db.users.findOne({"uname":username}, function(err, data) {
        if(data){
            res.send(data);
            console.log(data);
        }
        else {
            res.send("user not in database");
        }
    });
});

//get a specific receipt
app.post('/getReceipt/:idD', function(req, res) {
    var recId = req.params.idD;
    db.receipts.findOne({recNum:recId}, function(err, data) {
        if(!data) {
            res.send("Receipt not in database");
        }
        else {
            res.send(data);
        }
    });
});

//get a specific receipt
app.post('/getLogdInUser', function(req, res){

    var uname = req.session.uname;

    db.users.findOne({uname:uname}, function(err, data) {
      
        if(data) {
             res.send(data);
        }
        else {
            res.send("Error");
        }
    });
});

//get a specific station
app.post('/getStation/:id', function(req, res) {

    var id = Number(req.params.id);
    
    db.stations.findOne({stnId:id}, function(err, data) {
        if(data) {
            res.send(data);
        }
        else {
            res.send("Station not in database");
        }
    });
});

//get a specific customer
app.post('/getCustomer', function(req, res) {
    
    var num = req.body.custno;
    db.customers.findOne({"Account":num}, function(err, data) {
        if(data) {
            res.send(data);
            console.log(data);
        }
        else {
            res.send("Customer not in database");
        }
    });
});

//get a specific station
app.post('/getStation', function(req, res) {
    
    var num = Number(req.body.station);
    db.stations.findOne({stnId:num}, function(err, data) {
        if(data) {
            res.send(data);
            console.log(data);
        }
        else {
            res.send("Customer not in database");
        }
    });
});

//get a specific receipt
app.post('/getReceipt', function(req, res) {
    
    var num = req.body.recNo;
    db.receipts.findOne({"recNum":num}, function(err, data) {
        if(data) {
            res.send(data);
            console.log(data);
        }
        else {
            res.send("An error occured");
        }
    });
});
//get a specific receipt
app.post('/getCashier', function(req, res){

    var uname = req.session.uname;

    db.users.findOne({uname:uname}, function(err, data) {
      
        if(data) {
             res.send(data);
             console.log(data);
        }
        else {
            res.send("Error");
        }
    });
});

//get a single quotation
app.post('/getQuotation', function(req, res) {

    var ref = 'Quotation for '+req.body.QuoteDesc;
    db.quotes.findOne({Quot_Description:ref}, function(err, data) {
        if(data) {
           
            res.send(data);
        }
        else {
            res.send("Quotation not in database");
        }
    });
});

//get autoincrement values
app.post('/getValues', function(req, res) {
    var stationNum = req.body.station;
    db.receiptIncrVals.findOne({station: stationNum},function(err, data) {
        if(data) {   
            res.send(data);
        }
        else {
            res.send("Values not in database");
        }
    });
});

//***********************************************
//     RETRIVE ALL DOCUMENTS ROUTES
//**********************************************

//get all users from db route
app.post('/showAllUsers', function(req, res){
    db.users.find(function(err, data){
        if( err || !data) console.log("No data found!");
        else res.send(data);
    });
});

//get all stations from db route
app.post('/showAllStations', function(req, res){
    db.stations.find(function(err, data){
        if( err || !data){
          console.log("No data found!");  
        } else {
            res.send(data);
            console.log(data);
        }
    });
});

//get all receipts for particular Batch
app.post('/getBatchReceipts', function(req, res) {
    var query = req.body;
    batchId = query.batchId;
    console.log(query);
    stn = Number(query.myStn);
    dateFrom = new Date(query.dateFrom+" 00:00");
    dateTo   = new Date(query.dateTo+" 23:59");
    //console.log(dateFrom);
    db.receipts.find({ created_on: { $gte: dateFrom, $lte: dateTo }, stnNum:stn, cashierUname:query.cashierUname},function(err, data) {
        if(data) {
            console.log(data);
            res.send(data);
        }
        else {
            res.send("An error occured");
        }
    });
});

//get all Multi-Pay Receipts
app.post('/showAllMultiPays', function(req, res){
    
    db.receipts.find({$and:[{mPayID:{$ne:null}},{status:{$ne:"deleted"}}]}, function(err, data){
        if( err || !data) console.log("No data found!");
        else res.send(data);
    });
});

//get all customers from db route
app.post('/showAllCustomers', function(req, res){
        db.customers.find({Status: "LIVE "}, function(err, data){
        if( err || !data) console.log("No data found!");
        else {
            console.log(data);
            res.send(data);
        };
    });
});

//get all receipts from db route
app.post('/showAllReceipts', function(req, res){
        var stnCode = req.body.station;
        //stnCode = "^"+stnCode+"?????";
        console.log("Show station code for receipts "+stnCode);
        db.receipts.find({recNum : new RegExp('^'+stnCode)}, function(err, data){
        if( err || !data) console.log("No data found!");
        else {
            console.log(data);
            res.send(data);
        };
    });
});

//get all banks from db route
app.post('/showAllBanks', function(req, res){
   
    db.banks.find(function(err, data){
        if( err || !data) console.log("No data found!");
        else {
            res.send(data);
        };
    });
});

//get all batches from db route
app.post('/showAllBatches', function(req, res){
    db.batches.find(function(err, data){
        if( err || !data) console.log("No data found!");
        else {
            res.send(data);
        };
    });
});

//get all batches from db route
app.post('/showAllQuotes', function(req, res){
    db.quotes.find(function(err, data){
        if(err || !data) console.log("No data found!");
        else {
            res.send(data);
        };
    });
});

//get all glcodes from db route
app.post('/getGlCodes', function(req, res){
    db.glcodes.find(function(err, data){
        if(err || !data) console.log("No data found!");
        else {
            res.send(data);
        };
    });
});
//******************************RETRIEVE ROUTES END****************************

// **************************************************
//   ADD NEW DOCUMENTS
//**************************************************



//add new user into db route
app.post('/addNewUser', function(req, res) {
    newuser = req.body;
    db.users.insert(newuser, function (err, saved) {
        if(err) res.send("User already exist");
        else res.send("User Added");
    });
});

// add new log
app.post('/addNewLog', function(req, res) {
    newlog = req.body;
    console.log(newlog);
    db.receiptlog.insert(newlog, function (err, saved) {
        if(err) res.send("Log already exist");
        else res.send("Log Added");
    });
});
//add new station route
app.post('/addNewStation', function(req, res) {
    newstation = req.body;
    db.stations.insert(newstation);
    db.receiptIncrVals.insert({batchNo:0, recNo:0, station:newstation.stnBatchCode, transNo:0}, function (err, saved) {
        if( err || !saved ) console.log("Station not saved");
        else res.send("Station saved");
    });
});

//add new bank route
app.post('/addNewBank', function(req, res) {
    newbank = req.body;
   
    db.banks.save(newbank, function (err, saved) {
        if( err || !saved ) console.log("Bank not saved");
        else res.send("Bank saved");
    });
});

// add new batch
app.post('/createNewBatch', function(req, res) {
    newBatch = req.body;
    newBatch["created_on"] = new Date(newBatch.timeopened);
    db.batches.insert(newBatch, function (err, saved) {
        if( err || !saved ) console.log("Batch not saved");
        else {
            db.batches.find().sort({_id:-1}, function(err, data){
                res.send(data[0]);
            });
        }
    });
})

app.post('/incrementBatch', function (req, res) {
  
    var stn = req.body.station;
    var newBatchNo = req.body.batchNum;
    console.log(newBatchNo);
    console.log(stn);

    db.receiptIncrVals.update({station:stn},{$set: {batchNo:newBatchNo}}, function (err, saved){
        if (err) res.send ("An error occured");
        else res.send("Batch num incremented");
    })
});

// get the login log
app.post('/getUserLog', function(req, res){

    var user = req.body.uname;
    var logAction = "userLogin";
    db.receiptlog.find({action:logAction, loggedInUser:user}).sort({"_id":-1}, function(err, data){
        if( err || !data) {
            console.log("No data found!");
        }
        else {
            res.send(data);
        }

    });
});

// get previous batch
app.post('/getBatch', function(req, res){

    var station = req.body.stnNum;
    var user = req.body.openBy;
    db.batches.find({station: station, openBy:user}).sort({_id:-1}, function(err, data){
        if( err || !data) {
            console.log("No data found!");
        }
        else {
            console.log(data[0]);
            res.send(data[0]); 
        }
    });
});

//add new customer route
app.post('/addNewCustomer', function(req, res) {
    newcustomer = req.body;
    console.log(req.body);
    db.customers.save(newcustomer, function (err, saved) {
        if(err || !saved) console.log("Customer not saved");
        else res.send("Customer saved");
    });
});

//add new receipt route
app.post('/addNewReceipt', function(req, res){
    newreceipt = req.body;
    newreceipt["created_on"] = new Date(newreceipt.recDate);
    db.receipts.insert(newreceipt, function (err, saved) {
        if( err || !saved ) console.log("receipt not saved");
        else res.send("Receipt saved");
    });
});

//add new receipt into db route
app.post('/addNewQuote', function(req, res){
    newQuote = req.body;
    db.quotes.save(newQuote, function (err, saved) {
        if( err || !saved ) res.send("quote not saved");
        else res.send("Quote saved");
    });
});

//add new glCode into db route
app.post('/addNewGlCode', function(req, res){
    var newGlCode = req.body.glcode;
    var newGlCodeDesc = req.body.glCodeDesc
    console.log(newGlCodeDesc);

    db.glcodes.save({glcode:newGlCode, glCodeDesc:newGlCodeDesc}, function (err, saved) {
        if( err || !saved ) res.send("glcode not saved");
        else res.send("glcode saved");
    });
});

// Configure station 
app.post('/setStationParams', function(req, res){
    id = req.body.stnId;
    station = req.body.stnName;
    batchcode = req.body.stnBatchCode;
    lastbatch = req.body.stnLastBatch;
    lastreceipt = req.body.stnLastReceiptU;

    fs.writeFile('public/json/stationParams.json', '{"stnId":'+id+',"stnName":"'+station+'", "stnBatchCode":"'+batchcode+'", "stnLasBatch":"'+lastbatch+'","stnLastReceipt":"'+lastreceipt+'"}', 'utf8',
    function(err, data){
        if (err) throw error;
        res.send("Station parameters initialised");
        
    });
    /*db.stationParams.save(stationParams, function (err, saved) {
        if( err || !saved ) res.send("system params not saved");
        else res.send("System params saved");
    });*/
});
//*********************INSERTS ROUTES END************************

//******************************************************
//    DELETE DOCUMENTS
//*****************************************************

// delete a user rout
app.delete('/deleteUser/:username', function(req, res) {

    var user = req.params.username;
    console.log(user);
    db.users.remove({uname:user}, function(err, deleted) {
        if (err)
            res.send(err);
        else res.send ("User removed");

    });
});

//terminate Multi-Pay
app.delete('/deleteMPay/:mpayid', function(req, res) {

    var recs = Number(req.params.mpayid);
    console.log("Inside App: "+recs);
    db.receipts.remove({mPayID:recs}, function(err, deleted) {
        if (err)
            res.send(err);
        else res.send ("Multi-Pay removed");

    });
});

// delete a customer 
app.delete('/deleteCustomer/:custId', function(req, res) {
    var cust = req.params.custId;
    console.log(user);
    db.customers.remove({custId:user}, function(err, deleted) {
        if (err)
            res.send(err);
        else res.send ("Customer removed");

    });
});

// delete a station route
app.delete('/deleteStation/:stnId', function(req, res) {
    var station = Number(req.params.stnId);
    db.stations.remove({stnId:station}, function(err, deleted) {
        if (err)
            res.send(err);
        else res.send ("Station removed");
    });
});
//********************DELETE ROUTES END*******************************

//*****************************************************
//     UPDATE DOCUMENTS
//*****************************************************

//update status for Multi-Pay
app.post('/softDeleteMPay/:mpayid', function(req, res) {

    var recs = Number(req.params.mpayid);
    console.log("Inside App: "+recs);
    db.receipts.update({mPayID:recs},{$set: {status: "deleted"}}, { multi: true }, function(err, deleted) {
    //db.receipts.remove({mPayID:recs}, function(err, deleted) {
        if (err)
            res.send(err);
        else res.send ("Multi-Pay removed");

    });
});

// update user route
app.post('/updateUser/:uname', function(req, res) {
    var username = req.params.uname;
    var user = req.body;
    db.users.update({uname:username},{$set: {uname: user.uname, passkey : user.passkey, firstname: user.firstname, lastname: user.lastname, roles: user.roles }}, function (err, saved) {
        if(err) res.send("An error occured");
        else res.send("User successfully updated");
    });
});

app.post('/userlastlogin', function(req, res) {
    var username = req.body.username;
    var lastlogin = req.body.lastlogin;
    db.users.update({uname:username},{$set: {lastlogin: lastlogin}}, function (err, saved) {
        if(err) res.send("An error occured");
        else res.send("User successfully updated");
    });
});



// update receipt quote route
app.post('/updateRecQuote', function(req, res) {
    var Quot_descr = 'Quotation for '+req.body.qDescription;
    var Quot_balance = req.body.qBalance;
    //Quot_balance = Quot_balance.toString();
    console.log(Quot_descr);
    console.log(Quot_balance);
    db.quotes.update({Quot_Description:Quot_descr},{$set: {Quot_grossamt: Quot_balance}}, function (err, saved) {
        if(err) res.send("An error occured");
        else res.send("User successfully updated");
    });
});

// update aging route
app.post('/updateAging', function(req, res) {

    var account = req.body.account;
    var newBalance = req.body.balance;
    console.log(account);
    console.log(newBalance);
    db.customers.update({Account:account},{$set: {Current_Balance: newBalance}}, function (err, saved) {
        if(err) res.send("An error occured");
        else res.send("User successfully updated");
    });
});


// update autoincrements route
app.post('/updateAutoIncrements', function(req, res) {
    var stn = Number(req.body.station);
    var recno = req.body.recNo;
    var transno = req.body.transNo;
    var MPayID = req.body.mPayID;

    console.log("Update autoincrements");
    console.log(stn);
    console.log(recno);
    console.log(transno);

    db.receiptIncrVals.update({station:stn},{$set: {recNo:recno, transNo: transno, mPayID: MPayID}}, function (err, saved) {
        if(err) res.send("An error occured");
        else res.send("Inserts successfully updated");
    });
});

// transfer cashier route
app.post('/transfereCashier/:id', function (req, res) {
    var cashierId = req.params.id;
    var transferStn = req.body.station;

    db.users.update({uname:cashierId},{$set: {station:transferStn}}, function (err, saved){
        if (err) res.send ("An error occured");
        else res.send("Cashier transfered");
    })
});

// assign cashier route
app.post('/assignCashier/:id', function (req, res) {
    var cashierId = req.params.id;
    var transferStn = req.body.station;
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;

    db.users.update({uname:cashierId},{$set: {station:transferStn, transStartDate: startDate, transEndDatev: endDate}}, function (err, saved){
        if (err) res.send ("An error occured");
        else res.send("Cashier Assigned");
    })
});

// update receipt route
app.post('/cancelRec/:idD', function(req, res) {
    receipt = req.body.idD;
    var receiptNum = idD;
    var recid = req.params.recNum;

    db.receipts.update({recNum:receipt},{$set: {status: "cancelled"}}, function (err, saved) {
        if(err) res.send("An error occured");
        else res.send("Receipt Cancelled");
    });
});
// update customer route
app.post('/updateCustomer/:custId', function(req, res) {
    customer = req.body;
    var custid = req.params.custId;

    db.customers.update({CUSTNO:custid},{$set: {CUSTNO: customer.custno, CUSTNAME: customer.custNameU, CUSTADDR1:customer.custAddr1 , CUSTADDR2: customer.custAddr2, CUSTADDR3: customer.custAddr3 , CUSTREF: customer.custRef }}, function (err, saved) {
        if(err) res.send("An error occured");
        else res.send("Customer successfully updated");
    });
});
// update station route
app.post('/updateStation/:stnId', function(req, res) {
    
    station = req.body;
    var stnid = req.params.stnId;

    console.log(station.stnLastBatch);

    db.stations.update({stnId:stnid},{$set: {stnName: station.stnName, stnBatchCode : station.stnBatchCode, stnLastBatch: station.stnLastBatch, stnLastReceipt:station.stnLastReceipt}}, function (err, saved) {
        if(err) res.send("An error occured");
        else res.send("Station successfully updated");
    });
});
//**************************** UPDATE ROUTES END*******************************************

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
