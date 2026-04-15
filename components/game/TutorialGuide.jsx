// TutorialGuide.jsx
import React, { useState } from 'react';
import Modal from '@ui/Modal';
import Button from '@ui/Button';
import { HelpCircle, ChevronRight, ChevronLeft } from 'lucide-react';

const TutorialGuide = ({ steps }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];

  return (
    <>
      <Button variant="info" size="sm" icon={HelpCircle} onClick={() => setIsOpen(true)}>دليل المساعدة</Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="دليل البدء السريع">
        <div className="text-center p-4">
          <h3 className="text-2xl font-black text-primary mb-3">{step.title}</h3>
          <p className="text-gray-700 mb-6">{step.content}</p>
          
          <div className="flex justify-between items-center">
            <Button size="sm" icon={ChevronRight} disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)}>السابق</Button>
            <span className="font-bold text-sm text-gray-500">{currentStep + 1} / {steps.length}</span>
            <Button size="sm" icon={ChevronLeft} disabled={currentStep === steps.length - 1} onClick={() => setCurrentStep(currentStep + 1)}>التالي</Button>
          </div>
          
          {currentStep === steps.length - 1 && (
            <Button fullWidth variant="success" className="mt-4" onClick={() => setIsOpen(false)}>ابدأ اللعب!</Button>
          )}
        </div>
      </Modal>
    </>
  );
};
export default TutorialGuide;