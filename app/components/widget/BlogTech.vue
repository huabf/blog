<script setup lang="ts">
import { Icon } from '#components'
import { packageManager, version } from '~~/package.json'
import pnpmWorkspace from '~~/pnpm-workspace.yaml'

const appConfig = useAppConfig()
const { public: { arch, ci, nodeVersion, platform } } = useRuntimeConfig()

const ciPlatform = computed(() => {
	const iconName = ciIcons[ci]
	if (!iconName)
		return ''

	const iconNode = iconName.startsWith('http')
		? h('img', { src: iconName, alt: '' })
		: h(Icon, { name: iconName })

	return h('span', {}, [iconNode, ` ${ci.split(' ')[0]}`])
})

const packages = Object.assign({}, ...Object.values(pnpmWorkspace.catalogs as any)) as Record<string, string>
const [pm, pmVersion] = packageManager.split('@') as [string, string]

	function hostIcon(host: string) {
		if (/cloudflare|r2/i.test(host))
			return 'simple-icons:cloudflare'
		if (/github|raw.githubusercontent|githubusercontent/i.test(host))
			return 'simple-icons:github'
		return 'ph:link'
	}

	const service = computed(() => {
		const storageItem = () => {
			const avatar = appConfig.author?.avatar || ''
			if (!avatar)
				return '未知'
			if (avatar.startsWith('/'))
				return [h(Icon, { name: 'ph:folder' }), ' 仓库 public']
			try {
				const u = new URL(avatar)
				return [h(Icon, { name: hostIcon(u.hostname), alt: '' }), ` ${u.hostname}`]
			}
			catch {
				return avatar
			}
		}

		return [
			...ci ? [{ label: '构建平台', value: ciPlatform }] : [],
			{ label: '图片存储', value: storageItem },
			{ label: '软件协议', value: 'MIT' },
			{ label: '文章许可', value: appConfig.copyright.abbr },
			{ label: '规范域名', value: getDomain(appConfig.url) },
		]
	})

const techstack = computed(() => ([
	{ label: 'Blog', value: version },
	{ label: 'Vue', value: packages.vue },
	{ label: 'Nuxt', value: packages.nuxt },
	{ label: 'Content', value: packages['@nuxt/content'] },
	{ label: 'Node', value: nodeVersion },
	{ label: pm, value: pmVersion },
	{ label: 'OS', value: platform },
	{ label: 'Arch', value: arch },
]))

const expand = ref(false)
</script>

<template>
<BlogWidget card title="技术信息">
	<ZDlGroup :items="service" />
	<ZExpand v-model="expand" in-place name="构建信息">
		<ZDlGroup size="small" :items="techstack" />
	</ZExpand>
</BlogWidget>
</template>

<style lang="scss" scoped>
.z-expand {
	margin-top: 0.2em;
}

.dl-group :deep(img) {
	height: 1.2em;
	vertical-align: sub;
}
</style>
