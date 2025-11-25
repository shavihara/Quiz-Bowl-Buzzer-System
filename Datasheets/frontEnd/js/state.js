function loadConfig(){
  try{ 
    const s = localStorage.getItem('config'); 
    if(s) {
      const config = JSON.parse(s);
      console.log('Loaded config from localStorage:', config);
      return config;
    }
  } catch(e) {
    console.error('Error loading config:', e);
  }
  console.log('Using default config');
  return { quote:'', duration:10000, pattern:'beep', teams:Array.from({length:10},(_,i)=>({name:'Team '+(i+1)})) };
}
