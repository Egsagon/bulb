/*
    BULB Content script
*/

const inject = (parent, _key = null) => {
    // Create a button for a parent video

    let btn = document.createElement('button')
    btn.classList.add('bulb')
    btn.innerHTML = 'Download'

    btn.addEventListener('click', async ev => {
        // Send a download event to background script
        
        let key = _key || ev.target.parentNode.dataset.videoVkey
        console.log('[ BULB ] Queueing download for', key)
        ev.target.innerHTML = '<i></i>'

        let response = await browser.runtime.sendMessage({ key: key })
        ev.target.innerHTML = response.message
        ev.target.classList.add('bulb-success')
    })

    parent.appendChild(btn)
}

window.addEventListener('DOMContentLoaded', () => {

    // Inject buttons to all videos
    document.querySelectorAll('.videoblock').forEach(video => inject(video))

    // Inject to main video player if appears
    if (location.href.includes('view_video.php')) { inject(
        document.querySelector('.video-actions-menu'),
        /viewkey=(.*?)$/g.exec(location.href)[1]
    )}

})

// EOF