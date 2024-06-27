/*
    BULB Content script
*/

const update = (button, text, status = undefined, progress = undefined) => {
    // Update a button (status = idle | running | success | error)

    if (status) {
        button.classList.remove('running')
        button.classList.remove('success')
        button.classList.remove('error')
        button.classList.add(status)
    }

    // Update bar and text
    button.querySelector('p').innerHTML = text
    button.querySelector('div').style.width = progress
}

const inject = (parent, key, small = true) => {
    // Create a button for a parent video

    let btn = document.createElement('button')
    btn.innerHTML = '<p></p><div></div>'
    
    btn.classList.add('bulb')
    btn.classList.add('bulb-' + key)
    if (small) btn.classList.add('small')
    update(btn, 'Download')
    
    btn.addEventListener('click', async ev => {
        // Send a download event to background script
        
        console.log('[ BULB ] Queueing download for', key)
        update(ev.target, 'Queued', 'running')

        let response = await browser.runtime.sendMessage({ key: key })
        update(ev.target, response.message, response.type)
    })

    parent.appendChild(btn)
}

window.addEventListener('DOMContentLoaded', () => {

    // Inject buttons to all videos
    document.querySelectorAll('.videoblock').forEach(block => {
        let video = block.querySelector('.phimage')
        inject(video, block.dataset.videoVkey)
    })

    // Inject to main video player
    if (location.href.includes('view_video.php')) { inject(
        document.querySelector('.video-actions-menu'),
        /viewkey=(.*?)$/g.exec(location.href)[1]
    )}
})

browser.runtime.onMessage.addListener(message => {

    document.querySelectorAll(`.bulb-${message.key}`).forEach(btn => {
        let progress = Math.round(message.progress) + '%'
        update(btn, progress, 'running', progress)
    })

    return Promise.resolve(true);
})

// EOF