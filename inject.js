// Injects the download buttons

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.videoblock').forEach(video => {

        btn = document.createElement('button')
        btn.classList.add('bulb')
        btn.innerHTML = 'Download'

        btn.addEventListener('click', async ev => {
            
            console.log('Sending message to downloader')

            ev.target.innerHTML = '<i></i>'

            progress = await browser.runtime.sendMessage({
                key: ev.target.parentNode.dataset.videoVkey
            })

            console.log('Got response', progress)

            let inter = setInterval(() => {
                let value = progress()
                console.log('Updating value', value)
                ev.target.innerHTML = value


                if (value === 'Done') {
                    clearInterval(inter)
                    ev.target.classList.add('bulb-success')
                }

            }, 1000)

            // ev.target.innerHTML = 'Done'
        })

        video.appendChild(btn)
    })
})