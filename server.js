import express, { response } from 'express'
import bodyParser from 'body-parser'
import axios from 'axios'
import imageToBase64 from 'image-to-base64'
import path from 'path'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const app = express()
const ports = process.env.PORT||3000
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const portAi = [
    process.env.PNEUMOTHORAX, 
    process.env.TUBERCULOSIS, 
    process.env.EMPHYSEMA,
    process.env.PNEUMONIA
]

const urlAi = async()=> {
    const resultUrlAi = portAi.map( port => {
        let subEndpoint = port !== process.env.TUBERCULOSIS ? "prediction" : "tuberculosis"
        let url = `${process.env.URL_PREDICTION_AI}:${port}/${subEndpoint}`
        return url
    })
    return resultUrlAi
}

const PredictionAi = async(url, payload) => {
    const data = url.split(":")[2].split('/')[0] !== process.env.PNEUMONIA
    ? JSON.stringify({"img_pred": payload})
    : JSON.stringify({"image_base64": payload})

    let config = {
        method: 'post',
        url: url,
        headers: { 
        'Content-Type': 'application/json'
        },
        data: data
    }
    const result = await axios(config).then(response => response).catch(e => e.message)
    return result
}

const encodeImgToBase64 = async(filename) => {
    //เช็ค type file
    const checkFile = filename.split(".")[1] === ("jpg" || "png") ? true : false
    if (checkFile === true){
        //เช็ค ว่า มี file นี้อยู่จริงหรือไม่
        const pathFolder = path.dirname(__filename)

        //ต้องเเก้ให้เป็น path ที่ เก็บรูปของ stroage นั้นๆ
        let image = path.join(pathFolder, `./${filename}`)
        if (fs.existsSync(image)){
            const imgBase64 = await imageToBase64(image).then(response => response)
            return imgBase64
        }else{
            return "image is not exists"
        }
    }else{
        return "invalid type file"
    }
} 

const TuberculosisFrame = (payload)=>{
    let config = {
        method: 'post',
        url: process.env.URL_TUBERCULOSIS_AI,
        headers: { 
        'Content-Type': 'application/json'
        },
        data: JSON.stringify({"image_base64": payload})
    }
    const result = axios(config).then(response => response).catch(e => e.message)
    return Promise.resolve(result)
}

const ResultTuberculosisFrame = async(imgBase64) => {
    return TuberculosisFrame(imgBase64)
}

app.get("/nodepromise", async(req, res)=> {
    const fileName = req.query.imagename
    // const fileName = "343050.jpg"
    const urls = await urlAi()
    const payloadImgBase64 = await encodeImgToBase64(fileName)

    if (payloadImgBase64 !== "invalid type file" && payloadImgBase64 !== "image is not exists" && urls.length === portAi.length){

        await Promise.all(urls.map(url=> PredictionAi(url, payloadImgBase64).then(response=>response)))
        .then(async(value) => {

            // map() จะไม่รอการทำงานใดๆ เราจึงต้องใช้ Promise.all() มา ครอบ เพื่อถอดค่า
            //ref https://flaviocopes.com/javascript-async-await-array-map/
            const resultProcess = await Promise.all(value.map(async(_r) => {

                //เอา keys heatmap ออก
                delete _r.data[Object.keys(_r.data)[Object.keys(_r.data).length - 1]]
                
                //เช็ค keys normal
                const checkNormal = Object.keys(_r.data).includes("normal") === true
                ? parseFloat(_r.data.normal)
                : (1 - parseFloat(_r.data.result))*100 

                //เช็คว่าเป็น tuberculosis หรือไม่เพื่อไปเอาภาพตีกรอบ
                if (Object.keys(_r.data).includes("tuberculosis") && checkNormal < 70){
                    const getFrame = await ResultTuberculosisFrame(payloadImgBase64).then(response => response)
                    _r.data.img_result = getFrame.data.img_result
                    _r.data.normal = checkNormal
                    _r.data.result_ai = "unnormal"

                }else{
                    if (checkNormal < 50){
                        _r.data.normal = checkNormal
                        _r.data.result_ai = "unnormal"
                    }else{
                        _r.data.normal = checkNormal
                        _r.data.result_ai = "normal"
                    }
                }
                return _r.data
            }))
            res.status(200).json({message: "ok", status: "success", data: resultProcess})
        }).catch(e => {
            res.status(200).json({message: e.message, status: "fail", data: ""})
        })
    }else{
        res.status(200).json({message: payloadImgBase64, status: "fail", data: ""})
    }
})


app.listen(ports, async() => {
    console.log(`app listening on port ${ports}`)
})
  