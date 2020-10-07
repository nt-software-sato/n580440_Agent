'use strict';
const tenantid = "RXEH4PQ3BW";
const userid = "ManagerPM";
const passwd = "NewType1!";

//require('dotenv').config();
const path = require('path');
global.g_svrRoot = path.resolve(__dirname);
// global.g_config = require(`${g_svrRoot}/config.json`);

// const WebSocket = require('ws');
// const btoa = require('btoa');

const axios = require('axios');


const getDate = () => {
    var Today = new Date();
    var yyyy = Today.getFullYear().toString();
    var mm = (Today.getMonth() + 1).toString();
    var dd = Today.getDate().toString();
    var thisDate = yyyy + "" + (mm[1] ? mm : "0" + mm[0]) + "" + (dd[1] ? dd : "" + dd[0])
    return thisDate;
}


const getTime = () => {
    let Today = new Date();
    let HH = Today.getHours().toString();
    let mm = (Today.getMinutes()).toString();
    let ss = Today.getSeconds().toString();
    let thisTime = (HH[1] ? HH : "0" + HH[0]) + "" + (mm[1] ? mm : "0" + mm[0]) + "" + (ss[1] ? ss : "" + ss[0])
    return thisTime;
}
const accAuthRequest = axios.create({
    baseURL: 'http://phm.580440.com.cn/51794/s/',


});

const teraAPI = axios.create({
    baseURL: 'https://teraspection.feast.fujitsu.com/teraspection/',
});

let loginInfo = {
    "header": {
        "tenantid": tenantid,
        "sessionid": "",
        "userid": userid
    },
    "passwd": passwd,
    "force": "true"
}

const GetUserInfo = async (uid) => {
    return accAuthRequest.post(`/Signin/`, {

        "Id": "ZNKJ001",
        "Password": "e10adc3949ba59abbe56e057f20f883e"

    })
        .then(res => res.data.o)
        .then(data => {
            // console.warn("////////")
            //console.log(data)
            return JSON.parse(JSON.stringify(data[0]));

        }).catch((err) => {
            console.log(err)
        })
}

let parsePinData = (item) => {




    try {
        //console.log(item)
        let fieldData = item.fieldsdefinition;
        //console.log(fieldData)
        let fieldRowCount = fieldData[0].menulist.length;
        // console.log(fieldRowCount)
        let rebulid = [];
        let obj = {};
        for (let i = 0; i < fieldRowCount; i++) {
            // console.log(item.displayName)
            fieldData.map((item, index) => {
                //   console.log(item.displayname);
                //    console.log(item);
                (item.displayname === "Device ID") ? obj["DeviceID"] = item.menulist[i].text : "";
                (item.displayname === "Error Code") ? obj["ErrorCode"] = item.menulist[i].text : "";
                (item.displayname === "Description") ? obj["Description"] = item.menulist[i].text : "";
                (item.displayname === "Priority") ? obj["Priority"] = item.menulist[i].text : "";
            })
            //console.log(obj)
            rebulid.push(JSON.parse(JSON.stringify(obj)));
        }
        return rebulid;

    } catch {
        console.log("parsePinData ERROR")
    }
}


const getSession = async () => {
    return teraAPI.post(`/1.1/api/auth`, loginInfo)
        .then(res => {
            // console.warn("////////")
            //   console.log(res)
            return JSON.parse(JSON.stringify(res.data));
        }).catch((err) => {
            console.log(err)
        })
}

const getPins = async (getPinsReqData) => {
    return teraAPI.post(`/1.1/api/getPins`, getPinsReqData)
        .then(res => {
            // console.warn("////////")
            //console.log(res)
            return JSON.parse(JSON.stringify(res.data));
        }).catch((err) => {
            console.log(err)
        })
}




const sendData= async(userInfo,data,serial)=>{


    let fixData =
        {
            "eventType": 2, //int, 1:保養 2:報修
            "eventID": `FUJI-${getDate()}${getTime()}${serial}`, //string, 事件ID, PK
            "deviceID": `${data.DeviceID}`, //string, 装置ID
            "errorCode": [`${data.ErrorCode}`], //string array, 错误代码
            "description": [`${data.Description}`], //string
            "priority": (data.Priority)?parseInt(data.Priority):1, //int, 要求时限
            "timestamp": 1567650600 //int64, 时间标记
        }

   console.log(fixData)
    axios({
        headers: {'Passport': `${userInfo.Passport}`},
        method: 'POST',
        url: 'http://phm.580440.com.cn:8090/dev/error',
        data: fixData
    }).then((res) => {
        console.log(res.data);


    }).catch((err) => { console.log(err)
    })





}






const tranData = async (item) => {

    let userInfo = await GetUserInfo();
    let parsedData=parsePinData(item);
    parsedData.map((item,index)=>{
        sendData(userInfo,item,index);



    })
    console.log(parsedData);








    //console.log(userInfo.Passport)

    //  console.log(fixData);


}



const Main = async () => {
    let sessionData = await getSession();
    let cert = {
        "tenantid": "RXEH4PQ3BW",
        "sessionid": sessionData.sessionid || "",
        "userid": "ManagerPM"
    }
    let getPinsReqData = {
        "header": cert,
        "top": 0,
        "size": 100,
        "parentmapid": 478
    }
    let resultGetPinsData = await getPins(getPinsReqData);


    let pinsAry = resultGetPinsData.pins;
    // console.log(`//////////////////////////////////////////////////////////`)
      console.log(pinsAry);









    pinsAry.map((item) => {
         (item.pinid === 676) ? tranData(item) : "";


    })










}
Main();
setInterval(Main, 60000*5);

