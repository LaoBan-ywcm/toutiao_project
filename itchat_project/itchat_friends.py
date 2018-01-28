# -*- coding: utf-8 -*-
'''
    Author: qiuqi
    Date:   2018-01-25 14:12:02
    Last Modified by:   LaoBan-ywcm
    Last Modified time: 2018-01-28 22:17:34
'''
import itchat
from pprint import pprint
import csv

def main():
    # 登录
    itchat.auto_login(hotReload=True)
    friends = itchat.get_friends(update=True)[0:]

    # 将需要的数据写入csv文件
    friend_data = []
    for friend in friends[1:]:
        nickName = friend['NickName']
        remarkName = friend['RemarkName']
        city = friend['City']
        sex = friend['Sex']
        province = friend['Province']
        signature = friend['Signature']
        f_d = {
            'nickName': friend['NickName'],
            'remarkName': friend['RemarkName'],
            'city': friend['City'],
            'sex': friend['Sex'],
            'province': friend['Province'],
            'signature': friend['Signature'],
        }
        friend_data.append(f_d)
    with open('friends.csv', 'w') as f:
        writer = csv.writer(f)
        writer.writerow(['昵称', '备注', '性别', '省份', '城市', '签名'])
        for friend in friend_data:
            writer.writerow([friend['nickName'], friend['remarkName'], friend['sex'], friend['province'], friend['city'], friend['signature']])

    # 打开csv文件，分析男女比例和位置
    with open('./friends.csv') as f:
        reader = csv.reader(f)
        male = female = other = 0
        p_d = {}
        for row in reader:
            province = row[3]
            if reader.line_num == 1:pass
            else:
                # 分析性别
                sex = int(row[2])
                if sex == 1:
                    male += 1
                elif sex == 2:
                    female += 1
                else:
                    other += 1
                # 分析位置
                if province in p_d:
                    p_d[province] += 1
                else:
                    p_d[province] = 1
        print(male, female, other)
        print(p_d)



if __name__ == '__main__':
    main()
