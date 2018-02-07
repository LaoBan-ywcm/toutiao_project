/**
 * Created by hp-pc on 2017/6/7 0007.
 */
const http = require('http');
const fs = require('fs');
const cheerio = require('cheerio');

const baseUrl = 'http://www.imooc.com/learn/';
const baseNuUrl = 'http://www.imooc.com/course/AjaxCourseMembers?ids=';
//获取课程的ID
const videosId = [773,371];
//输出的文件
const outputFile = 'test.txt';
//记录学习课程的人数
let courseMembers = [];

//去除字符串中的空格
function Trim(str,is_global)
{
    let  result;
    result = str.replace(/(^\s+)|(\s+$)/g,"");
    if(is_global.toLowerCase()=="g")
    {
        result = result.replace(/\s/g,"");
    }
    return result;
}

//接受一个url爬取整个网页，返回一个Promise对象
function getPageAsync(url){
    return new Promise((resolve,reject)=>{
        console.log(`正在爬取${url}的内容`);
        http.get(url,function(res){
            let html = '';

            res.on('data',function(data){
                html += data;
            });

            res.on('end',function(){
                resolve(html);
            });

            res.on('error',function(err){
                reject(err);
                console.log('错误信息：' + err);
            })
        });
    })
}

//接受一个爬取下来的网页内容，查找网页中需要的信息
function filterChapter(html){
    const $ = cheerio.load(html);

    //所有章
    const chapters = $('.chapter');


    //课程的标题和学习人数
    let title = $('.hd>h2').text();
    let number = 0;

    //最后返回的数据
    //每个网页需要的内容的结构
    let courseData = {
        'title':title,
        'number':number,
        'videos':[]
    };

    chapters.each(function(item){
        let chapter = $(this);
        //文章标题
        let chapterTitle = Trim(chapter.find('strong').text(),'g');

        //每个章节的结构
        let chapterdata = {
            'chapterTitle':chapterTitle,
            'video':[]
        };


        //一个网页中的所有视频
        let videos = chapter.find('.video').children('li');
        videos.each(function(item){
            //视频标题
            let videoTitle = Trim($(this).find('a.J-media-item').text(),'g');
            //视频ID
            let id = $(this).find('a').attr('href').split('video/')[1];
            chapterdata.video.push({
                'title':videoTitle,
                'id':id
            })
        });

        courseData.videos.push(chapterdata);

    });

    return courseData;
}

//获取上课人数
function getNumber(url){

    let datas = '';

    http.get(url,(res)=>{
        res.on('data',(chunk)=>{
            datas += chunk;
        });

        res.on('end',()=>{
            datas = JSON.parse(datas);
            courseMembers.push({'id':datas.data[0].id,'numbers':parseInt(datas.data[0].numbers,10)});
        });
    });
}

//写入文件
function writeFile(file,string) {
    fs.appendFileSync(file,string,(err)=>{
            if(err){
                console.log(err);
            }
        })
}

//打印信息
function printfData(coursesData){

    coursesData.forEach((courseData)=>{
       writeFile(outputFile,`\n\n${courseData.number}人学习过${courseData.title}\n\n`);

        courseData.videos.forEach(function(item){
            let chapterTitle = item.chapterTitle;
            writeFile(outputFile,`\n  ${chapterTitle}\n`);

            item.video.forEach(function(item){
                writeFile(outputFile,`     【${item.id}】  ${item.title}\n`);
            })
        });

    });


}

//所有页面爬取完后返回的Promise数组
let courseArray = [];

//循环所有的videosId,和baseUrl进行字符串拼接，爬取网页内容
videosId.forEach((id)=>{
    //将爬取网页完毕后返回的Promise对象加入数组
    courseArray.push(getPageAsync(baseUrl + id));
    //获取学习的人数
    getNumber(baseNuUrl + id);
});

Promise
    //当所有网页的内容爬取完毕
    .all(courseArray)
    .then((pages)=>{
        //所有页面需要的内容
        let courseData = [];

        //遍历每个网页提取出所需要的内容
        pages.forEach((html)=>{
            let courses = filterChapter(html);
            courseData.push(courses);
        });

        //给每个courseMenners.number赋值
        for(let i=0;i<videosId.length;i++){
            for(let j=0;j<videosId.length;j++){
                if(courseMembers[i].id +'' == videosId[j]){
                    courseData[j].number = courseMembers[i].numbers;
                }
            }
        }

        //对所需要的内容进行排序
        courseData.sort((a,b)=>{
            return a.number > b.number;
        });

        //在重新将爬取内容写入文件中前，清空文件
        fs.writeFileSync(outputFile,'###爬取慕课网课程信息###',(err)=>{
            if(err){
                console.log(err)
            }
        });
        printfData(courseData);
    });