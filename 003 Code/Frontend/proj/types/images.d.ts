declare module '*.png' {
  const content: number; // React Native에서는 number 타입(import된 리소스 ID)
  export default content;
}
