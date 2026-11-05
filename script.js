const menuButton = document.querySelector('#menuButton');
const mobileMenu = document.querySelector('#mobileMenu');
const filterButtons = document.querySelectorAll('.filter-btn');
const eventCards = document.querySelectorAll('.event-card');
const joinForm = document.querySelector('#joinForm');
const formMessage = document.querySelector('#formMessage');
const contactForm = document.querySelector('#contactForm');
const contactMessageStatus = document.querySelector('#contactMessageStatus');

menuButton?.addEventListener('click', () => {
  const isOpen = !mobileMenu.classList.contains('hidden');
  mobileMenu.classList.toggle('hidden');
  menuButton.setAttribute('aria-expanded', String(!isOpen));
});

mobileMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selected = button.dataset.filter;

    filterButtons.forEach((item) => {
      item.classList.remove('bg-white', 'text-ink');
      item.classList.add('border', 'border-white/20', 'text-white');
    });

    button.classList.add('bg-white', 'text-ink');
    button.classList.remove('border', 'border-white/20', 'text-white');

    eventCards.forEach((card) => {
      const shouldShow = selected === 'all' || card.dataset.type === selected;
      card.classList.toggle('hidden', !shouldShow);
    });
  });
});

joinForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.querySelector('#name').value.trim();
  const track = document.querySelector('#track').value;
  const firstName = name.split(' ')[0] || 'Builder';

  formMessage.textContent = `${firstName}, your ${track} invite is ready. Meet the club at the next build session.`;
  formMessage.classList.remove('hidden');
  joinForm.reset();
});

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.querySelector('#contactName').value.trim();
  const purpose = document.querySelector('#contactPurpose').value;
  const firstName = name.split(' ')[0] || 'Friend';

  contactMessageStatus.textContent = `${firstName}, your ${purpose.toLowerCase()} message is ready for the CodeZen team.`;
  contactMessageStatus.classList.remove('hidden');
  contactForm.reset();
});
