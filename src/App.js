import {useEffect} from "react";
import * as d3 from "d3";
import './AppScatterplotGraph.css';

const ScatterplotGraph = () => {

  useEffect(()=>{
    let cyclistData, svg, boxData, textData, w, h, pddg, xScale, yScale, xAxis, yAxis, minutes, seconds, time, boxOver, circleOver;

    pddg = 40;
    w = 800;
    h = window.innerHeight > 600 
      ? window.innerHeight - 150
      : window.innerHeight > 450
        ? window.innerHeight - 80
        : 450;

    d3.json("https://raw.githubusercontent.com/garciapereirajuan/utils/main/cyclist-data.json")
      .then(data => init(data))
      .catch(err => console.log(err));

    const init = (data) => {
      data.forEach( d => {
          d.Place = +d.Place;
          var parsedTime = d.Time.split(':');
          d.Time = new Date(1970, 0, 1, 0, parsedTime[0], parsedTime[1]);
      });
      cyclistData = data;
      createSVG();
      createScales();
      createAxis();
      createPoints();
      createLegend();
    }

    const createSVG = () => {
      svg = d3.select(".scatterplot-graph")
        .append("svg")
        .attr("class", "chart-svg")
        .attr("width", w)
        .attr("height", h)
    }

    const getTime = (x) => {
        var date = new Date(null);

        date.setSeconds(x);
        seconds = date.getSeconds();
        if(seconds === 0) seconds = "00";
        minutes = date.getMinutes();
        console.log(typeof(minutes))

        time = `${minutes}:${seconds}`;
      return minutes;
    }

    const createScales = () => {
      const min = (prop) => d3.min(cyclistData, d => d[prop]);
      const max = (prop) => d3.max(cyclistData, d => d[prop]);
      
      xScale = d3.scaleLinear()
        .domain([min("Year") - 1, max("Year") + 1])
        .range([pddg, w - pddg]);
      yScale = d3.scaleLinear()
        .domain([min("Seconds"), max("Seconds")])
        .range([h - pddg, pddg]);
    }

    const createAxis = () => {
      xAxis = d3.axisBottom(xScale).tickFormat(x => x);
      yAxis = d3.axisLeft(yScale).tickFormat(x => { getTime(x); return time; });

      svg.append("g")
        .attr("id", "x-axis")
        .attr("transform", `translate(0, ${h - pddg})`)
        .call(xAxis)
        .call(g => g.append("text")
              .attr("x", w - pddg/2 + 5)
              .attr("y", pddg - 5)
              .attr("fill", "white")
              .text("Año"))
      svg.append("g")
        .attr("id", "y-axis")
        .attr("transform", `translate(${pddg}, 0)`)
        .call(yAxis)
        .call(g => g.append("text")
              .attr("x", pddg/2 + 5)
              .attr("y", pddg/2)
              .attr("fill", "white")
              .text("Tiempo total"))
    }

    const playAnim = (classesOne, classesAll, time, attr, value) => {
      if(classesOne) 
        d3.select(classesOne)
          .transition().duration(time[0]).attr(attr[0], value[0])
          .transition().duration(time[1]).attr(attr[1], value[1])
          .transition().duration(time[2]).attr(attr[2], value[2]);
      else
        d3.selectAll(classesAll)
          .transition().duration(time[0]).attr(attr[0], value[0])
          .transition().duration(time[1]).attr(attr[1], value[1])
          .transition().duration(time[2]).attr(attr[2], value[2]);
    } 

    const openBox = (d) => {
      var dop = d.Doping;
      var heightBox;
      var widthBox = 350;
      if(dop==="") {heightBox = 60; widthBox = 175;}
      else if(dop.length <= 50) heightBox = 75;
      else if(dop.length > 50) heightBox = 90;
      var currentBox = document.querySelector(".box-"+d["Place"]);
      if(!currentBox){
        d3.selectAll(".boxData").remove();
        createBoxData(d);
        createTextData(d);
        d3.select("#tooltip").attr("data-year", d.Year);
      }

      playAnim( 
        null, ".box", [0,0,0], 
        ["height", "width", "opacity"], [0,0,0] 
      );
      playAnim( 
        null, ".textBox", [150, 150],              
        ["visibility", "opacity"], ["hidden", 0] 
      );
      playAnim( 
        ".box-"+d.Place, null, [200, 100, 200], 
        ["height", "opacity", "width"], 
        [heightBox, 1, widthBox]
      );
      playAnim(
        ".textBox-"+d.Place, null, [300, 300],
        ["visibility", "opacity"], ["visible", 1]
      );
    }

    const closeBox = () => {
      setTimeout(()=> {
        if(!boxOver && !circleOver){
          playAnim(null, ".dot", [300], ["r"], [7]);
          playAnim(null, ".box", [200, 0, 0], 
                  ["width", "height", "opacity"], [0,0,0]);
          playAnim(null, ".textBox", [0,0], 
                  ["visibility", "opacity"], ["hidden", 0]);
        }}, 300);
    }

    const createPoints = () => {
      svg.selectAll("circle")
        .data(cyclistData)
        .enter()
        .append("circle")
        .attr("id", d => "circle-"+d.Place)
        .attr("class", "dot")
        .attr("cx", d => xScale(d["Year"]))
        .attr("cy", d => yScale(d["Seconds"]))
        .attr("data-xvalue", d => d["Year"])
        .attr("data-yvalue", d => {return d.Time.toISOString()})
        .attr("r", d => d.Doping ? 7 : 9) 
        .attr("fill", d => d.Doping ? "#fb8b23" : "#61D65Dff")
        .attr("stroke", "#212529")
        .attr("stroke-width", "1.5px")
        .on("mouseover", (e, d)=>{
            d3.selectAll(".dot")
              .transition().duration(300).attr("r", 6);
            d3.select("#circle-"+d.Place)
              .transition().duration(300).attr("r", 12); 
            circleOver = true;
            openBox(d);
        })
        .on("mouseout", (e, d)=>{
            circleOver = false;  
            closeBox();
        })
    }

    const getX = (d) => {
      var x = xScale(d["Year"]);
      var long = w - pddg - 200;
      var dop = d.Doping;
      return x > long 
        ? dop === ""
            ? x - 175 
            : x - 350 
        : x + 5;
    };
      
    const getY = (d) => {
      var y = yScale(d["Seconds"]);
      var long = h - pddg - 100;
      return y > long ? y - 100 : y + 5; 
    };

    const createBoxData = (d) => {
      boxData = svg.append("g")
        .attr("class", "boxData");
      
      boxData
        .append("rect")
        .attr("class", "box box-"+d["Place"])
        .attr("width", 0)
        .attr("height", 0)
        .attr("opacity", 0)
        .attr("stroke", d.Doping ? "#fb8b23" : "#7ae582")
        .attr("x", getX(d))
        .attr("y", getY(d))
        .attr("rx", 5)
        .attr("ry", 5)
        .on("mouseover", ()=> boxOver = true)
        .on("mouseout", ()=> {
          boxOver = false;
          closeBox();
      });    
    }

    const createTextData = (d) => {
      
      const createTspan = (x, dy, text, year) => {
        textData
          .append("tspan")
          .attr("x", x)
          .attr("dy", dy)
          .text(text);
      }
      
      const lineBreak = (d) => {
        var dop = d.Doping;
        if(dop !== ""){
          if(dop.length <= 50){
            createTspan((getX(d)+7), 
                        "1.2em", `Info: ${d.Doping}.`, d.Year);
          }
          if(dop.length > 50){
            createTspan((getX(d)+7), 
                        "1.2em", `Info: ${dop.substring(0, 50)}_`, d.Year);
            createTspan((getX(d)+7), "1.2em", 
                        `${dop.substring(50, dop.length)}.`, d.Year);
          }
        }
      }
    
      textData = boxData.append("text")
        .attr("class", "textBox textBox-"+d["Place"])
        .attr("id", "tooltip")
        .attr("x", getX(d) + 15)
        .attr("y", getY(d) + 20)
        .attr("visibility", "hidden")
        .attr("opacity", 0)
        .attr("fill", "#f8f9fa")
        .style("font-size", ".8em")
        .on("mouseover", ()=> {
        boxOver = true
      })
        .on("mouseout", ()=> {
        boxOver = false;
        closeBox();
      })
        
      getTime(d.Seconds);
      createTspan((getX(d)+7), "0em", `${d.Name} (${d.Nationality})`, d.Year);
      createTspan((getX(d)+7), "1.2em", `Año: ${d.Year}`, d.Year);
      createTspan((getX(d)+7), "1.2em", `Tiempo: ${time}`, d.Year);
      lineBreak(d);
    }

    const createLegend = () => {
      var legend = svg.append("g")
        .attr("id", "legend")
      legend
        .append("rect")
        .attr("x", w - pddg + 5)
        .attr("y", h/2 + 88)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#61D65Dff")
      legend
        .append("rect")
        .attr("x", w - pddg + 5)
        .attr("y", h/2 + 108)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#fb8b23")
      legend
        .append("text")
        .attr("x", w - pddg)
        .attr("y", h/2 + 100)
        .attr("class", "legend")
        .text("Corredores sin doping alegado");
      legend
        .append("text")
        .attr("x", w - pddg)
        .attr("y", h/2 + 120)
        .attr("class", "legend")
        .text("Con doping positivo");
    }
  });

  return(
    <div className="scatterplot-graph"> </div>
  );
}

const AppScatterplotGraph = () => {
  return (
    <div className="AppScatterplotGraph">
        <div className="title" id="title">
            Doping en ciclistas profesionales
        </div>  
        <div className="subtitle">
            35 tiempos más rápidos en&nbsp;<a href="https://es.wikipedia.org/wiki/Alpe_d%27Huez">Alpe d'Huez</a>&nbsp; (Francia)
        </div>
        <ScatterplotGraph />
    </div>
  );
}

export default AppScatterplotGraph;
