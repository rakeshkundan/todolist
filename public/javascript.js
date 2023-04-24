let path=document.getElementById("Menu").addEventListener("click",()=>{
    document.getElementById("img-div").classList.toggle("invisible");
    document.getElementById("Menu").classList.toggle("activate");
    document.getElementById("Menu").classList.toggle("deactivate");

  });
  document.getElementsByClassName("body")[0].addEventListener("click",()=>{
    document.getElementById("img-div").classList.add("invisible");
    document.getElementById("Menu").classList.remove("activate");
    document.getElementById("Menu").classList.add("deactivate");
  });
