<script setup lang="ts">
const { timeEstablished } = useAppConfig()

const blogLog = [
	{ label: timeEstablished, value: '发布第一篇文章' },
]
</script>

<template>
<BlogWidget card title="更新日志">
	<ZDlGroup size="large" :items="blogLog" />
</BlogWidget>
</template>
