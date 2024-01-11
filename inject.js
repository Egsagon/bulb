// Injects the download buttons

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.videoblock').forEach(video => {

        btn = document.createElement('button')
        btn.classList.add('bulb')
        btn.innerHTML = 'Download'

        btn.addEventListener('click', async ev => {
            
            console.log('Sending message to downloader')

            ev.target.innerHTML = '<i></i>'

            stat = await browser.runtime.sendMessage({
                key: ev.target.parentNode.dataset.videoVkey
            })

            console.log('Got status', stat)

            // ev.target.innerHTML = 'Done'
        })

        video.appendChild(btn)
    })
})