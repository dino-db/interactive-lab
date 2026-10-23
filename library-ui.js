/* PDB Labs searchable algorithm catalog — V4 BETA */
(() => {
    'use strict';
    const lib=window.PDBLibrary, grid=document.getElementById('library-grid');
    const input=document.getElementById('library-search');
    const categories=document.getElementById('library-categories');
    let selectedCategory='All',selectedId='dijkstra';
    const groups=['All',...new Set(lib.catalog.map(a=>a.category))];
    const icons={Graphs:'◇',Sorting:'▥',Searching:'⌕',Mathematics:'∑','Dynamic programming':'▦'};
    for(const category of groups){
        const button=document.createElement('button');button.type='button';button.className='library-filter';button.textContent=category;
        button.setAttribute('aria-pressed',String(category===selectedCategory));
        button.addEventListener('click',()=>{selectedCategory=category;render();});categories.append(button);
    }
    function render(){
        const q=input.value.trim().toLowerCase();
        const matching=lib.catalog.filter(a=>(selectedCategory==='All'||a.category===selectedCategory) && [a.title,a.category,a.description,a.complexity].join(' ').toLowerCase().includes(q));
        categories.querySelectorAll('button').forEach(b=>{const active=b.textContent===selectedCategory;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
        grid.replaceChildren();
        if(!matching.length){const empty=document.createElement('p');empty.className='library-empty';empty.textContent='No matching algorithms. Try another search or category.';grid.append(empty);}
        for(const item of matching){
            const button=document.createElement('button');button.type='button';button.className='library-card';button.dataset.algorithm=item.id;
            if(item.id===selectedId)button.classList.add('selected');
            button.setAttribute('aria-pressed',String(item.id===selectedId));
            const top=document.createElement('div');top.className='library-card-top';
            const icon=document.createElement('span');icon.className='library-card-icon';icon.textContent=icons[item.category]||'✦';
            const category=document.createElement('span');category.className='library-card-category';category.textContent=item.category;
            top.append(icon,category);
            const name=document.createElement('strong');name.textContent=item.title;
            const description=document.createElement('p');description.textContent=item.description;
            const bottom=document.createElement('div');bottom.className='library-card-bottom';
            const complexity=document.createElement('span');complexity.textContent=item.complexity;
            const arrow=document.createElement('span');arrow.textContent='Explore ↗';
            bottom.append(complexity,arrow);button.append(top,name,description,bottom);
            button.addEventListener('click',()=>{
                window.PDBAlgorithms.choose(item.id);
                document.querySelector('.lab-shell').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
            });
            grid.append(button);
        }
        document.getElementById('library-count').textContent=`${lib.catalog.length} algorithms`;
        document.getElementById('library-results').textContent=`Showing ${matching.length} of ${lib.catalog.length} algorithms`;
    }
    input.addEventListener('input',render);
    window.addEventListener('pdb:algorithm-selected',e=>{selectedId=e.detail.algorithm;render();});
    render();
})();
