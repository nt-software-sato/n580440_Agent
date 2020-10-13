'use strict';
const tenantid = "RXEH4PQ3BW";
const userid = "ManagerPM";
const passwd = "NewType1!";
const path = require('path');
const { promisify } = require('util');
const axios = require('axios');
global.g_svrRoot = path.resolve(__dirname);

let f_loginFail = false;

const wait = promisify(setTimeout);
const getJsonLength = (jsonData) => {
    var jsonLength = 0;
    for (var item in jsonData) {
        jsonLength++;
    }
    return jsonLength;
}

const accAuthRequest = axios.create({
    baseURL: 'http://phm.580440.com.cn/51794/s/',
});

const teraAPI = axios.create({
    baseURL: 'https://teraspection.feast.fujitsu.com/teraspection/',
});

const loginInfo = {
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
            return JSON.parse(JSON.stringify(data[0]));
        }).catch((err) => {
            console.log(err)
        })
}

const GetSession = async () => {
    return teraAPI.post(`/1.1/api/auth`, loginInfo)
        .then(res => {
            return JSON.parse(JSON.stringify(res.data));
        }).catch((err) => {
            console.log(err)
        })
}

const GetPins = async (getPinsReqData) => {
    return teraAPI.post(`/1.1/api/getPins`, getPinsReqData)
        .then(res => {
            if (res.data.commonresponse.code !== 200) {
                f_loginFail = true;
                console.log(res.data.commonresponse.message);
            }
            return JSON.parse(JSON.stringify(res.data));
        }).catch((err) => {
            console.log(err)
        })
}

const GetInspData = async (getPinsReqData) => {
    return teraAPI.post(`/1.1/api/getInspData`, getPinsReqData)
        .then(res => {
            if (res.data.commonresponse.code !== 200) {
                f_loginFail = true;
                console.log(res.data.commonresponse.message);
            }
            return JSON.parse(JSON.stringify(res.data));
        }).catch((err) => {
            console.log(err)
        })
}

const SendData = async (userInfo, data, serial) => {
    let fixData =
    {
        "eventType": 2, //int, 1:保養 2:報修
        "eventID": `FUJI-${GetDate()}${GetTime()}${serial}`, //string, 事件ID, PK
        "deviceID": `${data.DeviceID}`, //string, 装置ID
        "errorCode": [`${data.ErrorCode}`], //string array, 错误代码
        "description": [`${data.Description}`], //string
        "priority": (data.Priority) ? parseInt(data.Priority) : 1, //int, 要求时限
        "timestamp": 1567650600 //int64, 时间标记
    }
    console.log(fixData);
    axios({
        headers: { 'Passport': `${userInfo.Passport}` },
        method: 'POST',
        url: 'http://phm.580440.com.cn:8090/dev/error',
        data: fixData
    }).then((res) => {
        console.log(`===發送數據=========================================`);
        console.log(res.config);
        console.log(res.data);
    }).catch((err) => {
        console.log(err)
    })
}

let sessionData = {};
let i = 0;

const Main = async () => {

    wait(500).then(async () => {
        if (i % 500 == 0 || f_loginFail) {
            console.log("REFLASH");
            sessionData = await GetSession();
            i++;
            f_loginFail = !f_loginFail;
        } else {
            i++;
        }
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
        wait(500).then(async () => {
            console.log(`sesseion`, sessionData.sessionid);

            let resultGetPinsData = {}
            resultGetPinsData = await GetPins(getPinsReqData);
            console.log(`GetPins....`, getJsonLength(resultGetPinsData))

            let pinsAry = [];
            pinsAry = resultGetPinsData.pins;
            console.log(`resultGetPinsData.pins`, pinsAry.length);

            let deviceErrorPinID = [];
            pinsAry.map((item) => {
                //  (item.pinid === 676) ? TranData(item) : "";
                (item.title === "Device Error") ? deviceErrorPinID.push(item.pinid) : "";
            })
            console.log(`deviceErrorPinID`, deviceErrorPinID);

            let getInspDataReq = {
                "header": cert,
                "top": "0",
                "size": 999999999
            }

            wait(1500).then(async () => {
                if (deviceErrorPinID.length > 0) {
                    console.log(`GetInspData....`);
                    let resultGetInspData = {}
                    resultGetInspData = await GetInspData(getInspDataReq);
                    let pinHistoryAry = [];
                    pinHistoryAry = resultGetInspData.inspectionHistory;
                    let deviceErrorPinAry = [];
                    deviceErrorPinAry = pinHistoryAry.filter((item) => {
                        return deviceErrorPinID.indexOf(item.pinid) > -1
                    })
                    let ParsePinHistoryAry = (item) => {
                        let fieldData = item.inspectionData;
                        let fieldDataRowCount = fieldData.length;
                        let rebulid = [];
                        let obj = {
                            "DeviceID": "",
                            "ErrorCode": "",
                            "Priority": "",
                            "Description": "",
                            "Timestamp": null
                        };
                        fieldData.map((sitem, sindex) => {
                            obj["pinid"] = item.pinid;
                            obj["recorddate"] = new Date(item.recorddate + "GMT +00:00");
                            (sitem.displayname === "Device ID") ? obj["DeviceID"] = sitem.value : "";
                            (sitem.displayname === "Error Code") ? obj["ErrorCode"] = sitem.value : "";
                            (sitem.displayname === "Description") ? obj["Description"] = sitem.value : "";
                            (sitem.displayname === "Priority") ? obj["Priority"] = sitem.value : "";
                            (sitem.displayname === "Timestamp") ? obj["Timestamp"] = new Date(sitem.value + "GMT +00:00") : "";
                        })
                        return obj;
                    }
                    let userInfo = await GetUserInfo();
                    deviceErrorPinAry.map((item, index) => {
                        let trimedSendData = ParsePinHistoryAry(item);
                        let now = Date.now();
                        let timeDefer = (now - trimedSendData.recorddate) / 60 / 1000;
                        // console.log(timeDefer);
                        if (timeDefer <= 0.2) {
                            SendData(userInfo, trimedSendData, index);
                        }
                    })
                }
                console.log(`end..`)
                //do stuff
            })
            //do stuff
        })
    })
}

const GetDate = () => {
    var Today = new Date();
    var yyyy = Today.getFullYear().toString();
    var mm = (Today.getMonth() + 1).toString();
    var dd = Today.getDate().toString();
    var thisDate = yyyy + "" + (mm[1] ? mm : "0" + mm[0]) + "" + (dd[1] ? dd : "" + dd[0])
    return thisDate;
}
const GetTime = () => {
    let Today = new Date();
    let HH = Today.getHours().toString();
    let mm = (Today.getMinutes()).toString();
    let ss = Today.getSeconds().toString();
    let thisTime = (HH[1] ? HH : "0" + HH[0]) + "" + (mm[1] ? mm : "0" + mm[0]) + "" + (ss[1] ? ss : "" + ss[0])
    return thisTime;
}

Main();
setInterval(Main, 60000 * 0.15);
