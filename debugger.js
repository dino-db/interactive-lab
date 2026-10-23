/* PDB Labs Python execution trace viewer — V4 BETA. Not a live breakpoint debugger. */
(() => {
    'use strict';
    const $=id=>document.getElementById(id);
    const overlay=$('trace-overlay'),codeHost=$('trace-code'),variables=$('trace-variables'),stack=$('trace-stack');
    let worker=null,watchdog=null,events=[],index=0,source='',busy=false,previousFocus=null;
    const text=(tag,cls,content)=>{const node=document.createElement(tag);if(cls)node.className=cls;node.textContent=String(content);return node;};
    function status(message){$('trace-status').textContent=message;}
    function stop(){
        if(watchdog!==null)clearTimeout(watchdog);
        watchdog=null;if(worker){worker.terminate();worker=null;}
        busy=false;$('trace-start').disabled=false;$('trace-start').textContent='▶ Start trace';$('trace-stop').hidden=true;
    }
    function open(){
        previousFocus=document.activeElement;source=window.PDBPlayground.getCode();events=[];index=0;
        codeHost.replaceChildren();variables.replaceChildren();stack.replaceChildren();
        source.split('\n').forEach((line,i)=>{
            const row=text('div','trace-line','');row.dataset.line=String(i+1);
            row.append(text('span','trace-line-number',String(i+1).padStart(2,'0')),text('span','trace-line-text',line||' '));codeHost.append(row);
        });
        $('trace-description').textContent='Start a trace to inspect Python line events, local variables and function calls.';
        status('READY');$('trace-counter').textContent='0 / 0';$('trace-progress').disabled=true;$('trace-progress').value=0;
        $('trace-prev').disabled=true;$('trace-next').disabled=true;
        overlay.hidden=false;$('trace-close').focus();
    }
    function close(){stop();overlay.hidden=true;previousFocus?.focus();}
    function show(){
        if(!events.length)return;
        const event=events[index];
        codeHost.querySelectorAll('.trace-line').forEach(row=>row.classList.toggle('active',Number(row.dataset.line)===event.line));
        codeHost.querySelector('.trace-line.active')?.scrollIntoView({block:'nearest',behavior:'auto'});
        $('trace-description').textContent=`${event.event.toUpperCase()} · Line ${event.line} · ${event.function}()`;
        status(event.event.toUpperCase());variables.replaceChildren();stack.replaceChildren();
        const pairs=Object.entries(event.locals||{});
        if(!pairs.length)variables.append(text('div','trace-empty','No local variables yet'));
        for(const [name,value] of pairs){const row=text('div','trace-var','');row.append(text('strong','',name),text('code','',value));variables.append(row);}
        if(!event.stack?.length)stack.append(text('div','trace-empty','Global scope'));
        for(const [i,name] of (event.stack||[]).entries())stack.append(text('div','trace-stack-item',`${i+1}. ${name}()`));
        $('trace-counter').textContent=`${index+1} / ${events.length}`;
        $('trace-progress').max=events.length-1;$('trace-progress').value=index;
        $('trace-prev').disabled=index===0;$('trace-next').disabled=index===events.length-1;
    }
    function start(){
        if(busy)return;
        if(!source.trim()){status('EMPTY CODE');$('trace-description').textContent='Write some Python before tracing.';return;}
        stop();busy=true;events=[];index=0;
        $('trace-start').disabled=true;$('trace-start').textContent='Preparing Python…';$('trace-stop').hidden=false;
        status('LOADING');$('trace-description').textContent='Loading Python runtime and collecting execution events…';
        worker=new Worker('./trace-worker.js');
        worker.onmessage=({data})=>{
            if(data.type==='loading'){status('LOADING PYTHON');return;}
            if(data.type==='tracing'){status('TRACING');$('trace-start').textContent='Tracing…';return;}
            if(data.type==='complete'){
                stop();events=data.data.events||[];
                if(events.length){index=0;$('trace-progress').disabled=false;show();}
                else {$('trace-description').textContent='No Python line events were collected.';status('NO EVENTS');}
                if(data.data.error){status('TRACE ERROR');$('trace-description').textContent+=` · ${data.data.error}`;}
                if(data.data.output){const output=text('pre','trace-output',data.data.output);stack.append(output);}
                return;
            }
            if(data.type==='error'){stop();status('ERROR');$('trace-description').textContent=data.message;}
        };
        worker.onerror=e=>{stop();status('ERROR');$('trace-description').textContent=e.message||'Worker failed';};
        worker.postMessage({type:'trace',code:source});
        watchdog=setTimeout(()=>{if(!busy)return;stop();status('TIME LIMIT');$('trace-description').textContent='Trace exceeded 20 seconds. Reduce loops or simplify the program.';},20000);
    }
    $('trace-btn').addEventListener('click',open);
    $('trace-close').addEventListener('click',close);
    $('trace-start').addEventListener('click',start);
    $('trace-stop').addEventListener('click',()=>{stop();status('STOPPED');$('trace-description').textContent='Trace stopped by user.';});
    $('trace-prev').addEventListener('click',()=>{index=Math.max(0,index-1);show();});
    $('trace-next').addEventListener('click',()=>{index=Math.min(events.length-1,index+1);show();});
    $('trace-progress').addEventListener('input',e=>{index=Number(e.target.value);show();});
    overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    overlay.addEventListener('keydown',e=>{
        if(e.key==='Escape'){e.preventDefault();close();return;}
        if(e.key==='Tab'){
            const controls=[...overlay.querySelectorAll('button:not(:disabled):not([hidden]),input:not(:disabled)')];
            const first=controls[0],last=controls.at(-1);
            if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
            else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
        }
    });
})();
