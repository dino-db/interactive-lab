"""Browser smoke tests; requires Playwright and Chromium."""
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height in [(1440,900),(390,844)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        html=(root/'index.html').read_text()
        logo=base64.b64encode((root/'assets/pdb-labs-logo.png').read_bytes()).decode()
        html=html.replace('./assets/pdb-labs-logo.png','data:image/png;base64,'+logo)
        page.set_content(html,wait_until='domcontentloaded')
        for css in ['app.css','v2.css','algorithms.css','v4.css']:
            page.add_style_tag(content=(root/css).read_text())
        for js in ['app.js','library-data.js','v2.js','algorithms.js','library-ui.js','debugger.js']:
            page.add_script_tag(content=(root/js).read_text())
        page.on('dialog',lambda dialog:dialog.accept())
        if width<500:
            page.locator('#mobile-menu').click()
        page.locator('#nav-algorithms').click()
        assert page.locator('#library-grid .library-card').count()==16
        page.locator('#library-search').fill('quicksort')
        assert page.locator('#library-grid .library-card').count()==1
        page.locator('#library-grid .library-card').first.click()
        assert page.locator('#lab-algo-title').inner_text()=='Quicksort'
        page.locator('#lab-next').click()
        assert page.locator('#lab-step-counter').inner_text().startswith('STEP 1')
        page.locator('#library-search').fill('')
        page.locator('.library-filter',has_text='Mathematics').click()
        assert page.locator('#library-grid .library-card').count()==3
        page.locator('#library-grid .library-card').first.click()
        assert page.locator('#lab-algo-title').inner_text()=='Fibonacci sequence'
        page.locator('#lab-next').click()
        assert page.locator('.sequence-cell').count()>=1
        page.screenshot(path=str(root/f'preview-library-{width}.png'),full_page=True)
        page.locator('#lab-open-code').click()
        assert page.locator('#code-workspace').is_visible()
        page.locator('#trace-btn').click()
        assert page.locator('#trace-overlay').is_visible()
        assert page.locator('.trace-line').count()>1
        page.locator('#trace-close').click()
        assert not page.locator('#trace-overlay').is_visible()
        if errors: raise AssertionError(f'Browser JS errors ({width}px): {errors}')
        page.screenshot(path=str(root/f'preview-v4-{width}.png'),full_page=True)
        print(f'PASS: browser smoke {width}x{height}, 16 catalog cards, filter, visualizer, debugger modal')
        page.close()
    browser.close()
