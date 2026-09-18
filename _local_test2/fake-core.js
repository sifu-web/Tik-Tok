self.createFFmpegCore = async function(){
  const files=new Map();
  return {ret:0,setLogger(){},setProgress(){},setTimeout(){},exec(){this.ret=0},ffprobe(){this.ret=0},reset(){},FS:{writeFile(path,data){files.set(path,new Uint8Array(data))},readFile(path){return files.get(path)||new Uint8Array()},unlink(path){files.delete(path)}}}
}
