import { ChatModelCard, ModelProviderCard } from '@/types/llm';

import OpenAIProvider from './openai';

/**
 * @deprecated
 */
export const LOBE_DEFAULT_MODEL_LIST: ChatModelCard[] = [OpenAIProvider.chatModels].flat();

export const DEFAULT_MODEL_PROVIDER_LIST = [OpenAIProvider];

export const filterEnabledModels = (provider: ModelProviderCard) => {
  return provider.chatModels.filter((v) => v.enabled).map((m) => m.id);
};

export const isProviderDisableBrowserRequest = (id: string) => {
  const provider = DEFAULT_MODEL_PROVIDER_LIST.find((v) => v.id === id && v.disableBrowserRequest);
  return !!provider;
};

export { default as Ai21ProviderCard } from './ai21';
export { default as Ai360ProviderCard } from './ai360';
export { default as AnthropicProviderCard } from './anthropic';
export { default as AzureProviderCard } from './azure';
export { default as AzureAIProviderCard } from './azureai';
export { default as BaichuanProviderCard } from './baichuan';
export { default as BedrockProviderCard } from './bedrock';
export { default as CloudflareProviderCard } from './cloudflare';
export { default as CohereProviderCard } from './cohere';
export { default as DeepSeekProviderCard } from './deepseek';
export { default as FireworksAIProviderCard } from './fireworksai';
export { default as GiteeAIProviderCard } from './giteeai';
export { default as GithubProviderCard } from './github';
export { default as GoogleProviderCard } from './google';
export { default as GroqProviderCard } from './groq';
export { default as HigressProviderCard } from './higress';
export { default as HuggingFaceProviderCard } from './huggingface';
export { default as HunyuanProviderCard } from './hunyuan';
export { default as InfiniAIProviderCard } from './infiniai';
export { default as InternLMProviderCard } from './internlm';
export { default as JinaProviderCard } from './jina';
export { default as LMStudioProviderCard } from './lmstudio';
export { default as MinimaxProviderCard } from './minimax';
export { default as MistralProviderCard } from './mistral';
export { default as ModelScopeProviderCard } from './modelscope';
export { default as MoonshotProviderCard } from './moonshot';
export { default as NovitaProviderCard } from './novita';
export { default as NvidiaProviderCard } from './nvidia';
export { default as OllamaProviderCard } from './ollama';
export { default as OpenAIProviderCard } from './openai';
export { default as OpenRouterProviderCard } from './openrouter';
export { default as PerplexityProviderCard } from './perplexity';
export { default as PPIOProviderCard } from './ppio';
export { default as QiniuProviderCard } from './qiniu';
export { default as QwenProviderCard } from './qwen';
export { default as SambaNovaProviderCard } from './sambanova';
export { default as Search1APIProviderCard } from './search1api';
export { default as SenseNovaProviderCard } from './sensenova';
export { default as SiliconCloudProviderCard } from './siliconcloud';
export { default as SparkProviderCard } from './spark';
export { default as StepfunProviderCard } from './stepfun';
export { default as TaichuProviderCard } from './taichu';
export { default as TencentCloudProviderCard } from './tencentcloud';
export { default as TogetherAIProviderCard } from './togetherai';
export { default as UpstageProviderCard } from './upstage';
export { default as V0ProviderCard } from './v0';
export { default as VertexAIProviderCard } from './vertexai';
export { default as VLLMProviderCard } from './vllm';
export { default as VolcengineProviderCard } from './volcengine';
export { default as WenxinProviderCard } from './wenxin';
export { default as XAIProviderCard } from './xai';
export { default as XinferenceProviderCard } from './xinference';
export { default as ZeroOneProviderCard } from './zeroone';
export { default as ZhiPuProviderCard } from './zhipu';
