import React from 'react'

const Footer = () => (
  <footer className="footer">
    <div className="footer__text">
      <span className="footer__text__highlight">Support</span> this project:
    </div>
    <iframe
      className="footer__iframe"
      title="Star on Github"
      src="https://ghbtns.com/github-btn.html?user=davidcetinkaya&repo=embla-carousel&type=star&count=true&size=large"
      frameBorder="0"
      scrolling="0"
      width="160px"
      height="30px"
    />
  </footer>
)

export default Footer
